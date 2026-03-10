import { useState, useEffect, useRef, useMemo } from 'react'
import Decimal from 'break_eternity.js'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { OverlayScrollArea } from '@/components/ui/overlay-scroll-area'
import { Atom, Brain, Coins, Lock, Zap, MoreVertical, TrendingUp, Timer, Circle, Minus, Triangle, Square, Pentagon, Hexagon, Octagon } from 'lucide-react'
import { HeptagonIcon, NonagonIcon, DecagonIcon } from '@/components/ui/shape-icons'
import './App.css'

// Componente estável fora de App — evita recriação e piscar dos botões na aba Melhorias
function UpgradeCard({ icon: Icon, title, rankText, desc, effect, cost, atMax, onBuy, canBuy, cardClassName, trackClassName, trackDarkClassName, fillClassName, format }) {
  return (
    <div className={cn("relative flex flex-col gap-3 overflow-hidden p-4 min-h-0", cardClassName)}>
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        <div className={cn("flex-1 min-h-0", trackClassName)} />
        <div className={cn("flex-1 min-h-0", trackDarkClassName)} />
      </div>
      <div className="relative z-10 flex items-center gap-2">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", trackClassName, "bg-white/10")}>
          <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">{title}</span>
          <span className="ml-1.5 text-xs text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">{rankText}</span>
        </div>
      </div>
      <p className="relative z-10 text-xs text-white/85 leading-relaxed [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">{desc}</p>
      <div className="relative z-10 text-sm font-semibold tabular-nums text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">{effect}</div>
      {atMax ? (
        <div className="relative z-10 mt-auto rounded-lg px-3 py-2 text-xs font-medium text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
          Máximo atingido
        </div>
      ) : (
        <div className="relative z-10 mt-auto flex items-center gap-2">
          <div className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]",
            canBuy ? "text-amber-300" : "text-white/70"
          )}>
            <Brain className="h-3.5 w-3.5 text-violet-300" />
            {format(cost)} Insight{cost !== 1 ? 's' : ''}
          </div>
          <button
            type="button"
            disabled={!canBuy}
            onClick={() => canBuy && onBuy()}
            className={cn(
              "shrink-0 h-8 px-4 rounded-lg text-xs font-semibold transition-opacity [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]",
              canBuy ? cn(fillClassName, "text-white hover:opacity-90") : "bg-white/10 text-white/50 cursor-not-allowed"
            )}
          >
            Comprar
          </button>
        </div>
      )}
    </div>
  )
}

// Estilo neutro único para todas as linhas de produção (formas geométricas em vez de cores)
const LINE_STYLE = {
  track: 'bg-zinc-800/95 dark:bg-zinc-900/95',
  trackDark: 'bg-zinc-900/95 dark:bg-zinc-950/95',
  fill: 'bg-zinc-500',
  fillDark: 'bg-zinc-600',
  border: 'border-zinc-700/50 dark:border-zinc-800/50',
}

// Cores dos ícones dos geradores por linha (interior preenchido)
const LINE_ICON_COLORS = {
  rose: 'bg-rose-500',
  emerald: 'bg-emerald-500',
  blue: 'bg-sky-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  cyan: 'bg-cyan-500',
  orange: 'bg-orange-500',
  lime: 'bg-lime-500',
  fuchsia: 'bg-fuchsia-500',
  indigo: 'bg-indigo-500',
}

// Fallback para compatibilidade com gen.color (sempre slate)
const BAR_COLORS = { slate: LINE_STYLE }

// Barra de marcos: violeta (distinta das barras de progresso)
const MILESTONE_COLORS = {
  track: 'bg-violet-800/90 dark:bg-violet-900/90',
  trackDark: 'bg-violet-900/95 dark:bg-violet-950/95',
  fill: 'bg-violet-400 dark:bg-violet-400',
  fillDark: 'bg-violet-600 dark:bg-violet-600',
  border: 'border-violet-700/50 dark:border-violet-800/50',
}

// Limite da biblioteca break_infinity.js (~10^9e15)
const BREAK_INFINITY_MAX = Decimal.pow(10, 9e15)

// Custo base: G1 base 10 (segunda = 10), G2 = 100, G3 = 10k, G4 = 100 M — 10^(2^(id-1))
// Multipliers now scale natively in getBaseProductionForLine.
const getInitialCost = (id) => id === 1 ? new Decimal(10) : Decimal.pow(10, Math.pow(2, id - 1))

// Geradores usam estilo neutro (linhas diferenciadas por forma geométrica)
const BAR_COLOR_KEYS = Array.from({ length: 20 }, () => 'slate')

// Linhas de produção — tempo dobra, produção triplica por linha. baseProduction = 3^(N-1)
// Linha 1: 2s, 1 recurso | Linha 2: 4s, 3 recurso | Linha 3: 8s, 9 | Linha 4: 16s, 27 | ...
const PRODUCTION_LINES = [
  { id: 'rose', icon: Circle, cycleBaseMs: 2000, cycleRatio: 2, insightMultiplier: 1, baseProduction: 1 },
  { id: 'emerald', icon: Minus, cycleBaseMs: 4000, cycleRatio: 3, insightMultiplier: 2, baseProduction: 3 },
  { id: 'blue', icon: Triangle, cycleBaseMs: 8000, cycleRatio: 4, insightMultiplier: 3, baseProduction: 9 },
  { id: 'amber', icon: Square, cycleBaseMs: 16000, cycleRatio: 5, insightMultiplier: 4, baseProduction: 27 },
  { id: 'violet', icon: Pentagon, cycleBaseMs: 32000, cycleRatio: 6, insightMultiplier: 5, baseProduction: 81 },
  { id: 'cyan', icon: Hexagon, cycleBaseMs: 64000, cycleRatio: 7, insightMultiplier: 6, baseProduction: 243 },
  { id: 'orange', icon: HeptagonIcon, cycleBaseMs: 128000, cycleRatio: 8, insightMultiplier: 7, baseProduction: 729 },
  { id: 'lime', icon: Octagon, cycleBaseMs: 256000, cycleRatio: 9, insightMultiplier: 8, baseProduction: 2187 },
  { id: 'fuchsia', icon: NonagonIcon, cycleBaseMs: 512000, cycleRatio: 10, insightMultiplier: 9, baseProduction: 6561 },
  { id: 'indigo', icon: DecagonIcon, cycleBaseMs: 1024000, cycleRatio: 11, insightMultiplier: 10, baseProduction: 19683 },
]

const getCycleTimeMsForLine = (lineId, genId) => {
  const lineIdx = PRODUCTION_LINES.findIndex(l => l.id === lineId)
  const line = PRODUCTION_LINES[lineIdx]
  const base = lineIdx === -1 ? 2000 : (lineIdx + 2) * 1000
  const ratio = line?.cycleRatio ?? 2
  return base * Math.pow(ratio, genId - 1)
}

const getBaseProductionForLine = (lineId, genId = 1) => {
  const lineIdx = PRODUCTION_LINES.findIndex((l) => l.id === lineId)
  // G1 da linha 1 (idx 0) gera 3: genId (1) + lineIdx (0) + 2 = 3.
  // G2 da linha 1 gera 4. G1 da linha 2 gera 4.
  return genId + lineIdx + 2
}

const INITIAL_GENERATORS = Array.from({ length: 20 }, (_, i) => {
  const id = i + 1
  return {
    id,
    name: `Gerador ${id}`,
    cost: getInitialCost(id),
    cycleTime: getCycleTimeMsForLine('rose', id), // base usado para save; tempo real por linha
    cycleStartTime: 0,
    count: new Decimal(0),
    color: BAR_COLOR_KEYS[i],
  }
})

// Marcos: 10, 100, 1.000, 10.000, 100.000, 1 M, ... (cada marco = 1 Insight ao coletar)
const getMilestone = (index) => Decimal.pow(10, index + 1)
const getAtomUpgradeCost = (index) => new Decimal(500).times(Decimal.pow(10, index))

const SAVE_KEY = 'planible-save'

function parseLineDataFromRaw(raw) {
  const defaultMilestones = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, 0]))
  const generators = INITIAL_GENERATORS.map((gen) => {
    const saved = raw.generators?.find((g) => g.id === gen.id)
    if (!saved) return { ...gen }
    return {
      id: gen.id,
      name: gen.name,
      cost: new Decimal(saved.cost ?? getInitialCost(gen.id).toString()),
      cycleTime: gen.cycleTime,
      cycleStartTime: saved.cycleStartTime ?? 0,
      count: new Decimal(saved.count ?? 0),
      color: gen.color,
    }
  })
  return {
    currency: new Decimal(raw.currency ?? 0),
    generators,
    milestonesClaimed: { ...defaultMilestones, ...raw.milestonesClaimed },
    halfCycleRanks: raw.halfCycleRanks && typeof raw.halfCycleRanks === 'object' ? raw.halfCycleRanks : (Array.isArray(raw.halfCycleGenerators) ? Object.fromEntries(raw.halfCycleGenerators.map(id => [id, 1])) : {}),
    doubleProductionRanks: raw.doubleProductionRanks && typeof raw.doubleProductionRanks === 'object' ? raw.doubleProductionRanks : (Array.isArray(raw.doubleProductionGenerators) ? Object.fromEntries(raw.doubleProductionGenerators.map(id => [id, 1])) : {}),
    totalProduced: new Decimal(raw.totalProduced ?? 0),
    atomosClaimed: raw.atomosClaimed ?? 0,
  }
}

function getFreshLineData() {
  return {
    currency: new Decimal(0),
    generators: INITIAL_GENERATORS.map(g => ({
      ...g,
      cost: getInitialCost(g.id),
      count: new Decimal(0),
      cycleStartTime: 0,
    })),
    milestonesClaimed: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, 0])),
    halfCycleRanks: {},
    doubleProductionRanks: {},
    totalProduced: new Decimal(0),
    atomosClaimed: 0,
  }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    const lineData = {}
    // Migração: save antigo tem currency/generators no topo; novo tem lineData
    if (data.lineData && typeof data.lineData === 'object') {
      for (const line of PRODUCTION_LINES) {
        lineData[line.id] = data.lineData[line.id] ? parseLineDataFromRaw(data.lineData[line.id]) : getFreshLineData()
      }
    } else {
      // Save antigo: rose recebe os dados, outras linhas zeradas
      lineData.rose = parseLineDataFromRaw(data)
      for (const line of PRODUCTION_LINES) {
        if (line.id !== 'rose') lineData[line.id] = getFreshLineData()
      }
    }
    const validBuyMode = ['1x', '1%', '10%', '50%', '100%'].includes(data.buyMode) ? data.buyMode : '1x'
    return {
      insights: new Decimal(data.insights ?? 0),
      essence: new Decimal(data.essence ?? 0),
      lineData,
      activeProductionLine: PRODUCTION_LINES.some(l => l.id === data.activeProductionLine) ? data.activeProductionLine : 'rose',
      buyMode: validBuyMode,
      lastActiveTime: typeof data.lastActiveTime === 'number' ? data.lastActiveTime : null,
    }
  } catch {
    return null
  }
}

let initialSaveCache = null
function getInitialSave() {
  if (initialSaveCache !== null) return initialSaveCache
  initialSaveCache = loadSave()
  return initialSaveCache
}

function clearSaveCache() {
  initialSaveCache = null
}

// Barra de progresso suave: usamos animação CSS para garantir 60FPS fluidos
// Quando ciclo ≤ 0.25s: barra estática 100% com efeito de flow calmo
const FAST_CYCLE_MS = 250

function SmoothBar({ cycleStartTime, cycleTimeMs, active, fillClassName, fillDarkClassName, phaseSeed = 0 }) {
  const isFastCycle = cycleTimeMs > 0 && cycleTimeMs <= FAST_CYCLE_MS
  const useFlowMode = active && cycleStartTime > 0 && isFastCycle

  // Sincronização da animação CSS com o tempo do jogo — useMemo evita updates a cada render
  // (o loop do jogo atualiza a cada 100ms; atualizar animationDelay a cada tick causava jank)
  const animationStyle = useMemo(() => {
    if (!active || !cycleTimeMs || cycleStartTime <= 0 || isFastCycle) return {}
    const elapsed = (Date.now() - cycleStartTime) % cycleTimeMs
    const delay = -(elapsed / 1000)
    return {
      animation: `grow-x ${cycleTimeMs / 1000}s linear infinite`,
      animationDelay: `${delay}s`,
    }
  }, [cycleStartTime, cycleTimeMs, active, isFastCycle])

  const fillDark = fillDarkClassName ?? fillClassName

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 rounded-l-lg origin-left overflow-hidden flex flex-col transition-transform duration-200 ease-out bar-gpu-layer",
          !useFlowMode && !active && "scale-x-0"
        )}
        style={useFlowMode ? { transform: 'scaleX(1)' } : animationStyle}
      >
        <div className={cn('flex-1 min-h-0 rounded-none', fillClassName)} />
        <div className={cn('flex-1 min-h-0 rounded-none', fillDark)} />
      </div>
      {useFlowMode && (
        <div
          className="absolute inset-0 rounded-l-lg overflow-hidden pointer-events-none bar-gpu-layer"
          aria-hidden
        >
          <div
            className="absolute inset-y-0 w-2/5 rounded-l-lg bar-gpu-layer"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 20%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.05) 80%, transparent 100%)',
              animation: 'flow-shimmer 2.5s linear infinite',
              animationDelay: `-${(phaseSeed % 2500) / 1000}s`,
            }}
          />
        </div>
      )}
    </>
  )
}

const ATOM_CYCLE_MS = 1000 // 1 átomo a cada 1s, ciclo fixo

function UniversalResourceIcon() {
  return (
    <div
      className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/40 shadow-sm"
      style={{
        background: 'conic-gradient(from 0deg, #f43f5e 0deg, #10b981 36deg, #0ea5e9 72deg, #f59e0b 108deg, #8b5cf6 144deg, #06b6d4 180deg, #f97316 216deg, #84cc16 252deg, #d946ef 288deg, #6366f1 324deg)',
      }}
    >
      <div className="h-2 w-2 rounded-full bg-zinc-900 border border-white/20" />
    </div>
  )
}

function App() {
  // Game State (inicializa do localStorage se existir)
  const initial = getInitialSave()
  const [insights, setInsights] = useState(() => initial?.insights ?? new Decimal(0))
  const [essence, setEssence] = useState(() => initial?.essence ?? new Decimal(1))
  const [lineData, setLineData] = useState(() => {
    const ld = {}
    for (const line of PRODUCTION_LINES) {
      ld[line.id] = initial?.lineData?.[line.id] ?? getFreshLineData()
    }
    return ld
  })
  const [tab, setTab] = useState("generators") // generators | upgrades | atomos
  const [activeProductionLine, setActiveProductionLine] = useState(() => initial?.activeProductionLine ?? 'rose')
  const [fps, setFps] = useState(0)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [buyMode, setBuyMode] = useState(() => initial?.buyMode ?? '1x') // '1x' | '1%' | '10%' | '50%' | '100%'
  const buyModeRef = useRef(buyMode)
  buyModeRef.current = buyMode

  const activeLine = lineData[activeProductionLine]
  const currency = activeLine?.currency ?? new Decimal(0)
  const generators = activeLine?.generators ?? INITIAL_GENERATORS

  // Recurso universal = soma das moedas das 10 linhas (para progresso até o limite break_infinity.js)
  const universalResource = PRODUCTION_LINES.reduce((acc, line) => {
    const ld = lineData[line.id]
    const c = ld?.currency instanceof Decimal ? ld.currency : new Decimal(ld?.currency ?? 0)
    return acc.plus(c)
  }, new Decimal(0))

  // Progresso 0–100% até BREAK_INFINITY_MAX (limite break_infinity.js), usando log10
  const getProgressToBreakInfinityLimit = () => {
    if (universalResource.lte(1)) return 0
    try {
      const logVal = universalResource.log10().toNumber()
      const logMax = 9e15 // log10(10^9e15) = 9e15
      if (!Number.isFinite(logVal) || logVal <= 0) return 0
      return Math.min(100, (logVal / logMax) * 100)
    } catch {
      return 0
    }
  }
  const breakInfinityProgress = getProgressToBreakInfinityLimit()

  // Taxa de produção universal (recurso/segundo) = soma das taxas de cada linha (G1 produz moeda)
  const universalProductionRatePerSec = PRODUCTION_LINES.reduce((acc, line) => {
    const ld = lineData[line.id]
    if (!ld?.generators) return acc
    const gen1 = ld.generators.find(g => g.id === 1)
    if (!gen1) return acc
    const count1 = gen1.count instanceof Decimal ? gen1.count : new Decimal(gen1.count ?? 0)
    if (!count1.gt(0)) return acc
    const baseCycle = getCycleTimeMsForLine(line.id, 1)
    const halfRank = ld.halfCycleRanks?.[1] ?? 0
    const cycleMs = Math.max(100, baseCycle / Math.pow(2, halfRank))
    const mult1 = Math.pow(2, ld.doubleProductionRanks?.[1] ?? 0)
    const baseProd = getBaseProductionForLine(line.id, 1) // G1
    const rate = count1.times(mult1).times(baseProd).times(1000).div(cycleMs)
    return acc.plus(rate)
  }, new Decimal(0))

  const ERA_SEC = 31536000000000
  const getTimeToBreakInfinityLimitRaw = () => {
    if (universalProductionRatePerSec.lte(0)) return { ok: false, val: '—', timeSec: null }
    if (universalResource.gte(BREAK_INFINITY_MAX)) return { ok: false, val: 'Concluído', timeSec: null }
    try {
      const remaining = BREAK_INFINITY_MAX.minus(universalResource)
      let timeSec = remaining.div(universalProductionRatePerSec)
      if (timeSec.lt(0)) return { ok: false, val: '∞', timeSec: null }
      if (!Decimal.isFinite(timeSec) || timeSec.gte(BREAK_INFINITY_MAX)) timeSec = BREAK_INFINITY_MAX
      const secs = timeSec.toNumber()
      if (Number.isFinite(secs) && secs < 1e15) return { ok: true, secs, timeSec: null }
      return { ok: false, val: null, timeSec }
    } catch {
      return { ok: false, val: '∞', timeSec: null }
    }
  }
  const timeToBreakInfinityLimitRaw = getTimeToBreakInfinityLimitRaw()

  const milestonesClaimed = activeLine?.milestonesClaimed ?? Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, 0]))
  const halfCycleRanks = activeLine?.halfCycleRanks ?? {}
  const doubleProductionRanks = activeLine?.doubleProductionRanks ?? {}
  const isFirstGenUnlocked = lineData?.rose?.generators?.[0] && (lineData.rose.generators[0].count instanceof Decimal ? lineData.rose.generators[0].count : new Decimal(lineData.rose.generators[0].count)).gt(0)
  const atomsPerSecond = isFirstGenUnlocked ? 1 + PRODUCTION_LINES.reduce((sum, line) => sum + (lineData[line.id]?.atomosClaimed ?? 0), 0) : 0

  const resetGame = () => {
    clearSaveCache()
    localStorage.removeItem(SAVE_KEY)
    setInsights(new Decimal(0))
    setEssence(new Decimal(1))
    const fresh = {}
    for (const line of PRODUCTION_LINES) {
      fresh[line.id] = getFreshLineData()
    }
    setLineData(fresh)
    setActiveProductionLine('rose')
    setResetDialogOpen(false)
  }

  // Refs for Game Loop (Avoids stale closures and impure state updates)
  const lineDataRef = useRef(lineData)
  const tabRef = useRef(tab)
  const insightsRef = useRef(insights)
  const essenceRef = useRef(essence)
  const lastAtomTimeRef = useRef(Date.now())
  const activeProductionLineRef = useRef(activeProductionLine)

  useEffect(() => {
    lineDataRef.current = lineData
  }, [lineData])
  useEffect(() => {
    insightsRef.current = insights
    essenceRef.current = essence
    activeProductionLineRef.current = activeProductionLine
  }, [insights, essence, activeProductionLine])
  const [offlineDialog, setOfflineDialog] = useState(null) // { show: true, gains: {}, durationMs: 0, atoms: Decimal }

  useEffect(() => {
    tabRef.current = tab
    if (tab === 'generators' || tab === 'atomos') {
      setLineData(prev => {
        const ref = lineDataRef.current
        if (!ref) return prev
        const next = { ...prev }
        for (const k of Object.keys(ref)) next[k] = ref[k]
        return next
      })
    }
  }, [tab])

  // Persistir progresso no localStorage a cada 5 segundos
  useEffect(() => {
    const save = () => {
      const current = lineDataRef.current
      if (!current || typeof current !== 'object') return
      const lineDataSerial = {}
      for (const line of PRODUCTION_LINES) {
        const ld = current[line.id]
        if (ld) {
          lineDataSerial[line.id] = {
            currency: (ld.currency instanceof Decimal ? ld.currency : new Decimal(ld.currency ?? 0)).toString(),
            totalProduced: (ld.totalProduced instanceof Decimal ? ld.totalProduced : new Decimal(ld.totalProduced ?? 0)).toString(),
            atomosClaimed: ld.atomosClaimed ?? 0,
            generators: (ld.generators ?? []).map((g) => ({
              id: g.id,
              name: g.name,
              cost: (g.cost instanceof Decimal ? g.cost : new Decimal(g.cost ?? 0)).toString(),
              cycleTime: g.cycleTime,
              cycleStartTime: g.cycleStartTime ?? 0,
              count: (g.count instanceof Decimal ? g.count : new Decimal(g.count ?? 0)).toString(),
              color: g.color,
            })),
            milestonesClaimed: ld.milestonesClaimed ?? {},
            halfCycleRanks: ld.halfCycleRanks ?? {},
            doubleProductionRanks: ld.doubleProductionRanks ?? {},
          }
        }
      }
      const payload = {
        insights: insightsRef.current.toString(),
        essence: essenceRef.current.toString(),
        lineData: lineDataSerial,
        activeProductionLine: activeProductionLineRef.current,
        buyMode: buyModeRef.current,
        lastActiveTime: Date.now(),
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
    }
    const id = setInterval(save, 5000)
    const onHide = () => {
      if (document.hidden) save()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  // Progressão offline: ao montar, se passou tempo suficiente desde lastActiveTime, aplicar produção e mostrar dialog
  useEffect(() => {
    const initial = getInitialSave()
    if (!initial?.lastActiveTime) return
    const durationMs = Date.now() - initial.lastActiveTime
    if (durationMs < 10000) return
    const durationCapped = Math.min(durationMs, 7 * 24 * 3600 * 1000)
    const { nextLineData, gainsPerLine, atomsGained } = computeOfflineProduction(initial.lineData, durationCapped)
    const claimableInsights = getClaimableInsightsTotalFromLineData(nextLineData)
    setLineData(nextLineData)
    setEssence((e) => e.plus(atomsGained))
    essenceRef.current = (essenceRef.current || new Decimal(0)).plus(atomsGained)
    setOfflineDialog({ show: true, gains: gainsPerLine, durationMs: durationCapped, atoms: atomsGained, insights: claimableInsights, insightsClaimed: false })
  }, [])

  // FPS counter (atualiza a cada 2s para reduzir uso de memória)
  useEffect(() => {
    let frames = 0
    let lastTime = performance.now()
    let rafId
    const loop = () => {
      frames++
      const now = performance.now()
      if (now - lastTime >= 2000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)))
        frames = 0
        lastTime = now
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // Sempre 5 letras: AAAAA, AAAAB, ..., AAABA, ..., ZZZZZ (tier 0 a 26^5-1)
  const tierToLetters = (tier) => {
    const t = Math.min(Math.max(0, tier), 26 ** 5 - 1)
    const d4 = Math.floor(t / 26 ** 4) % 26
    const d3 = Math.floor(t / 26 ** 3) % 26
    const d2 = Math.floor(t / 26 ** 2) % 26
    const d1 = Math.floor(t / 26) % 26
    const d0 = t % 26
    const toChr = (n) => String.fromCharCode(65 + n)
    return toChr(d4) + toChr(d3) + toChr(d2) + toChr(d1) + toChr(d0)
  }

  // Formatação: 0 | inteiros sem decimais | decimais quando significativos (11,2 não 11)
  const trimTrailingZeros = (s) => s.replace(/\.?0+$/, '')
  const formatNumber = (num) => {
    const d = new Decimal(num)
    if (d.eq(0)) return '0'
    if (d.lt(0)) return '0'
    if (d.lt(0.005)) return '0.00'
    if (d.lt(1)) return d.toFixed(2)
    if (d.lt(1000)) return trimTrailingZeros(d.toFixed(2))
    if (d.lt(1e6)) {
      const val = d.div(1000).toNumber()
      return trimTrailingZeros(val.toFixed(2)) + 'k'
    }
    const log10 = d.log10().toNumber()
    if (!Number.isFinite(log10)) return d.toExponential(2).replace('+', '')

    // Até Decilhão (10^33): M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc
    const suffixes = ['M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']
    const exponentForDc = 33
    if (log10 < exponentForDc) {
      const suffixIndex = Math.floor(log10 / 3) - 2
      if (suffixIndex < 0) return d.toFixed(0)
      const idx = Math.min(suffixIndex, suffixes.length - 1)
      const divisor = Decimal.pow(10, 3 * (idx + 2))
      const value = d.div(divisor).toNumber()
      if (!Number.isFinite(value)) return d.toExponential(2).replace('+', '')
      const suffix = suffixes[idx]
      if (value >= 1000) return value.toFixed(2) + ' ' + suffix
      if (value >= 1) return value.toFixed(2) + ' ' + suffix
      return trimTrailingZeros(value.toFixed(2)) + ' ' + suffix
    }

    // A partir de 10^33: notação sempre com 5 letras (1 AAAAA ... 999 ZZZZZ)
    const tier = Math.floor((log10 - exponentForDc) / 3)
    const maxTier = 26 ** 5 - 1
    const safeTier = Math.min(Math.max(0, tier), maxTier)
    const letters = tierToLetters(safeTier)
    const divisor = Decimal.pow(10, exponentForDc + 3 * safeTier)
    const value = d.div(divisor).toNumber()
    if (!Number.isFinite(value)) return d.toExponential(2).replace('+', '')
    const valStr = value >= 1000 ? value.toFixed(0) : value >= 1 ? trimTrailingZeros(value.toFixed(2)) : value.toFixed(2)
    return valStr + ' ' + letters
  }

  const format = (num) => formatNumber(num)
  const formatCost = (num) => formatNumber(num)

  // Formatação de tempo: 1s, 59s, 1min, 59min, 1hora, 23horas, 1dia, 6dias, 1semana, 3semanas, 1mês, 11mêses, 1ano, 9anos, 1década, 1.000décadas, 1milénio, 999.999milénios, 1éra...
  const sep = (n) => n >= 1000 ? Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : Math.floor(n).toString()
  const formatTime = (totalSeconds) => {
    const secs = typeof totalSeconds === 'number' ? totalSeconds : new Decimal(totalSeconds).toNumber()
    if (!Number.isFinite(secs) || secs < 0) return '0s'
    const MIN = 60
    const HORA = 3600
    const DIA = 86400
    const SEMANA = 604800
    const MES = 2592000
    const ANO = 31536000
    const DECADA = 315360000
    const MILENIO = 31536000000
    const ERA = 31536000000000
    if (secs < MIN) return (secs < 1 ? secs.toFixed(2) : Math.round(secs)) + 's'
    if (secs < HORA) { const v = Math.floor(secs / MIN); return v + 'min' }
    if (secs < DIA) { const v = Math.floor(secs / HORA); return v + (v === 1 ? 'hora' : 'horas') }
    if (secs < SEMANA) { const v = Math.floor(secs / DIA); return v + (v === 1 ? 'dia' : 'dias') }
    if (secs < MES) { const v = Math.floor(secs / SEMANA); return v + (v === 1 ? 'semana' : 'semanas') }
    if (secs < ANO) { const v = Math.floor(secs / MES); return v + (v === 1 ? 'mês' : 'mêses') }
    if (secs < DECADA) { const v = Math.floor(secs / ANO); return v + (v === 1 ? 'ano' : 'anos') }
    if (secs < MILENIO) { const v = Math.floor(secs / DECADA); return sep(v) + (v === 1 ? 'década' : 'décadas') }
    if (secs < ERA) { const v = Math.floor(secs / MILENIO); return sep(v) + (v === 1 ? 'milénio' : 'milénios') }
    const v = Math.floor(secs / ERA)
    return sep(v) + (v === 1 ? 'éra' : 'éras')
  }

  const formatEraCount = (eraCount) => {
    const n = eraCount.toNumber()
    if (Number.isFinite(n) && n < 1e15) {
      if (n >= 1000) return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      return Math.round(n).toString()
    }
    try {
      const slogVal = eraCount.slog().toNumber()
      if (Number.isFinite(slogVal)) {
        if (slogVal >= 1e6) return '10^^' + slogVal.toExponential(2).replace('+', '')
        if (slogVal >= 1000) return '10^^' + Math.floor(slogVal).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        return '10^^' + Math.round(slogVal)
      }
    } catch (_) { }
    return '10^^1.79e308'
  }

  const timeToBreakInfinityLimit = timeToBreakInfinityLimitRaw.ok
    ? formatTime(timeToBreakInfinityLimitRaw.secs)
    : timeToBreakInfinityLimitRaw.timeSec
      ? (() => {
        try {
          const eraCount = timeToBreakInfinityLimitRaw.timeSec.div(ERA_SEC)
          const unit = eraCount.eq(1) ? 'éra' : 'éras'
          return formatEraCount(eraCount) + unit
        } catch {
          return '∞'
        }
      })()
      : timeToBreakInfinityLimitRaw.val

  const MIN_CYCLE_MS_OFFLINE = 100
  const computeOfflineProduction = (lineDataSnapshot, durationMs) => {
    const cap = Math.min(durationMs, 7 * 24 * 3600 * 1000)
    const nextLineData = {}
    const gainsPerLine = {}
    for (const line of PRODUCTION_LINES) {
      const ld = lineDataSnapshot[line.id]
      if (!ld || !ld.generators) {
        nextLineData[line.id] = ld
        continue
      }
      const up = { halfCycleRanks: ld.halfCycleRanks ?? {}, doubleProductionRanks: ld.doubleProductionRanks ?? {} }
      // Create a mutable copy of generators for offline production
      const nextGenerators = ld.generators.map(g => ({
        ...g,
        count: g.count instanceof Decimal ? g.count : new Decimal(g.count ?? 0)
      }));
      let currencyFromGen1 = new Decimal(0)

      for (let i = 0; i < nextGenerators.length; i++) {
        const gen = nextGenerators[i]
        const count = gen.count
        if (!count.gt(0)) continue

        const base = getCycleTimeMsForLine(line.id, gen.id)
        const rank = up.halfCycleRanks[gen.id] ?? 0
        const cycleTime = rank === 0 ? base : Math.max(MIN_CYCLE_MS_OFFLINE, base / Math.pow(2, rank))
        const upRank = up.doubleProductionRanks[gen.id] ?? 0
        const mult = Math.pow(2, upRank)
        const cycles = Math.floor(cap / cycleTime)
        const produced = new Decimal(cycles).times(count).times(mult)

        const baseProd = getBaseProductionForLine(line.id, gen.id)
        const currentProduction = produced.times(baseProd)

        if (gen.id === 1) {
          currencyFromGen1 = currentProduction
        } else {
          // Produz o gerador de id anterior
          const targetIdx = i - 1
          if (targetIdx >= 0) {
            nextGenerators[targetIdx].count = nextGenerators[targetIdx].count.plus(currentProduction)
          }
        }
      }

      const ldCurrency = ld.currency instanceof Decimal ? ld.currency : new Decimal(ld.currency ?? 0)
      const ldTotalProduced = ld.totalProduced instanceof Decimal ? ld.totalProduced : new Decimal(ld.totalProduced ?? 0)

      nextLineData[line.id] = {
        ...ld,
        currency: ldCurrency.plus(currencyFromGen1),
        generators: nextGenerators,
        totalProduced: ldTotalProduced.plus(currencyFromGen1),
      }
      gainsPerLine[line.id] = currencyFromGen1
    }
    const isFirstGenUnlocked = lineDataSnapshot?.rose?.generators?.[0] && (lineDataSnapshot.rose.generators[0].count instanceof Decimal ? lineDataSnapshot.rose.generators[0].count : new Decimal(lineDataSnapshot.rose.generators[0].count)).gt(0)
    const atomosBonus = Object.values(lineDataSnapshot).reduce((s, ld) => s + (ld?.atomosClaimed ?? 0), 0)
    const atomsPerSecond = isFirstGenUnlocked ? 1 + atomosBonus : 0
    const atomsGained = new Decimal(atomsPerSecond * (cap / 1000)).floor()
    return { nextLineData, gainsPerLine, atomsGained }
  }

  // Preços fixos (sem scaling ao comprar)
  const getCost = (gen) => {
    if (gen.id === 1) {
      const count = gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)
      if (count.eq(0)) return new Decimal(0)
    }
    return gen.cost
  }

  const getEssenceRequired = (lineId) => {
    const idx = PRODUCTION_LINES.findIndex(l => l.id === lineId)
    return idx >= 0 ? idx + 1 : 1
  }

  // Game Loop: lógica a cada 100ms; pausa quando aba oculta
  useEffect(() => {
    const INTERVAL_MS = 100
    const RENDER_INTERVAL_TICKS = 1
    let tickCount = 0
    const MIN_CYCLE_MS = 100
    const id = setInterval(() => {
      if (document.hidden) return // pausa quando aba não visível
      const now = Date.now()
      const current = lineDataRef.current
      if (!current || typeof current !== 'object') return
      const nextLineData = {}
      let hasUpdates = false
      for (const line of PRODUCTION_LINES) {
        const ld = current[line.id]
        if (!ld || !ld.generators) continue
        const up = { halfCycleRanks: ld.halfCycleRanks ?? {}, doubleProductionRanks: ld.doubleProductionRanks ?? {} }

        // Create a mutable copy of generators for this tick's production
        const nextGenerators = ld.generators.map(g => ({
          ...g,
          count: g.count instanceof Decimal ? g.count : new Decimal(g.count ?? 0),
          cycleStartTime: g.cycleStartTime || now, // Ensure cycleStartTime is set
        }));

        let currencyFromGen1 = new Decimal(0)
        let newCurrency = ld.currency instanceof Decimal ? ld.currency : new Decimal(ld.currency ?? 0);
        let ldTotalProduced = ld.totalProduced instanceof Decimal ? ld.totalProduced : new Decimal(ld.totalProduced ?? 0);

        for (let i = 0; i < nextGenerators.length; i++) {
          const gen = nextGenerators[i]
          const count = gen.count
          if (!count.gt(0)) continue

          const base = getCycleTimeMsForLine(line.id, gen.id)
          const rank = up.halfCycleRanks[gen.id] ?? 0
          const cycleTime = rank === 0 ? base : Math.max(MIN_CYCLE_MS, base / Math.pow(2, rank))

          const elapsed = now - gen.cycleStartTime
          const cycles = Math.floor(elapsed / cycleTime)

          if (cycles > 0) {
            hasUpdates = true;
            gen.cycleStartTime += cycles * cycleTime; // Update cycle start time

            const upRank = up.doubleProductionRanks[gen.id] ?? 0
            const mult = Math.pow(2, upRank)
            const produced = new Decimal(cycles).times(count).times(mult)

            const baseProd = getBaseProductionForLine(line.id, gen.id)
            const currentProduction = produced.times(baseProd)

            if (gen.id === 1) {
              currencyFromGen1 = currencyFromGen1.plus(currentProduction);
              newCurrency = newCurrency.plus(currentProduction);
              ldTotalProduced = ldTotalProduced.plus(currentProduction);
            } else {
              // Produz o gerador de id anterior
              const targetIdx = i - 1
              if (targetIdx >= 0) {
                nextGenerators[targetIdx].count = nextGenerators[targetIdx].count.plus(currentProduction)
              }
            }
          }
        }

        const active = nextGenerators.some(g => g.count.gt(0)); // Check if any generator is active
        if (active || currencyFromGen1.gt(0)) hasUpdates = true;

        nextLineData[line.id] = {
          ...ld,
          currency: newCurrency,
          generators: nextGenerators,
          totalProduced: ldTotalProduced,
        }
      }
      // Átomo: base 1/s + bônus dos resgates de Atomos (cada resgate +1/s)
      // Só começa a produzir passivamente se o G1 da primeira linha estiver comprado.
      const isFirstGenUnlocked = lineDataRef.current?.rose?.generators?.[0] && (lineDataRef.current.rose.generators[0].count instanceof Decimal ? lineDataRef.current.rose.generators[0].count : new Decimal(lineDataRef.current.rose.generators[0].count)).gt(0)

      const atomosBonus = Object.values(lineDataRef.current ?? {}).reduce((sum, ld) => sum + (ld?.atomosClaimed ?? 0), 0)
      const baseAtomsRate = isFirstGenUnlocked ? 1 + atomosBonus : 0
      const atomsPerSecond = baseAtomsRate
      let elapsed = now - lastAtomTimeRef.current
      while (elapsed >= ATOM_CYCLE_MS) {
        if (atomsPerSecond > 0) {
          essenceRef.current = (essenceRef.current || new Decimal(1)).plus(atomsPerSecond)
        }
        lastAtomTimeRef.current += ATOM_CYCLE_MS
        elapsed -= ATOM_CYCLE_MS
      }

      if (hasUpdates && Object.keys(nextLineData).length > 0) {
        lineDataRef.current = { ...lineDataRef.current, ...nextLineData }
      }
      if (tabRef.current === 'generators' || tabRef.current === 'atomos') {
        tickCount++
        if (tickCount >= RENDER_INTERVAL_TICKS) {
          tickCount = 0
          setEssence(essenceRef.current)
          setLineData(prev => {
            const next = { ...prev }
            for (const k of Object.keys(lineDataRef.current)) {
              next[k] = lineDataRef.current[k]
            }
            return next
          })
        }
      }
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const MIN_CYCLE_MS = 100
  // Para comprar G1 da linha N: precisa ter o Gerador N da linha anterior automatizado
  // Ex: Linha 2 (N=2) precisa do Gerador 3 da Linha 1 (que automatiza o G2)
  const canBuyLineG1 = (lineId) => {
    const lineIdx = PRODUCTION_LINES.findIndex(l => l.id === lineId)
    if (lineIdx <= 0) return true
    const prevLine = PRODUCTION_LINES[lineIdx - 1]
    const prevLd = lineData[prevLine.id]
    if (!prevLd?.generators) return false
    const requiredGenId = lineIdx + 2
    const gen = prevLd.generators.find(g => g.id === requiredGenId)
    if (!gen) return false
    const count = gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)
    return count.gt(0)
  }

  const canAffordNextGenerator = (lineId) => {
    const ld = lineData[lineId]
    if (!ld?.generators) return false
    const curr = ld.currency instanceof Decimal ? ld.currency : new Decimal(ld?.currency ?? 0)
    const ess = essence instanceof Decimal ? essence : new Decimal(essence ?? 0)
    const gens = ld.generators
    const maxPurchasedId = Math.max(0, ...gens.filter(g => (g.count instanceof Decimal ? g.count : new Decimal(g.count ?? 0)).gt(0)).map(g => g.id))
    const nextGen = gens.find(g => g.id === maxPurchasedId + 1)
    if (!nextGen) return false
    if (nextGen.id === 1 && !canBuyLineG1(lineId)) return false
    const cost = getCost(nextGen)
    const essenceReq = getEssenceRequired(lineId)
    return curr.gte(cost) && ess.gte(essenceReq)
  }

  // Máximo de geradores que dá para comprar com recurso e essência atuais
  const getMaxAffordableCount = (gen, lineId) => {
    const ld = lineData[lineId]
    if (!ld) return 0
    const cost = getCost(gen)
    const essenceReq = getEssenceRequired(lineId)
    const curr = ld.currency instanceof Decimal ? ld.currency : new Decimal(ld.currency ?? 0)
    const ess = essence instanceof Decimal ? essence : new Decimal(essence ?? 0)
    // G1 da linha pode ter custo 0: limitar só pela essência
    if (cost.lte(0)) {
      if (essenceReq <= 0) return 1
      return Math.min(ess.div(essenceReq).floor().toNumber(), Number.MAX_SAFE_INTEGER)
    }
    const byCurrency = curr.div(cost).floor()
    const byEssence = essenceReq <= 0 ? byCurrency : ess.div(essenceReq).floor()
    return Math.min(byCurrency.toNumber(), byEssence.toNumber(), Number.MAX_SAFE_INTEGER)
  }

  // Quantos comprar neste clique conforme o modo (1x ou % dos recursos)
  const getBuyCount = (mode, gen, lineId) => {
    const max = getMaxAffordableCount(gen, lineId)
    if (max <= 0) return 0
    if (mode === '1x') return 1
    const pct = mode === '1%' ? 0.01 : mode === '10%' ? 0.1 : mode === '50%' ? 0.5 : 1
    return Math.max(1, Math.floor(max * pct))
  }

  const buyGenerator = (id, count = null) => {
    const lineId = activeProductionLine
    const ld = lineData[lineId]
    if (!ld) return
    const gens = ld.generators ?? []
    const genIndex = gens.findIndex(g => g.id === id)
    if (genIndex === -1) return

    const gen = gens[genIndex]
    const upperGen = gens.find(g => g.id === id + 1)
    const upperCount = upperGen ? (upperGen.count instanceof Decimal ? upperGen.count : new Decimal(upperGen.count ?? 0)) : new Decimal(0)
    if (upperCount.gt(0)) return // gerador automatizado, não pode mais comprar
    if (id === 1 && !canBuyLineG1(lineId)) return // G1 exige linha anterior com gerador automatizado

    const n = count ?? getBuyCount(buyMode, gen, lineId)
    if (n <= 0) return

    const costOne = getCost(gen)
    const essenceReq = getEssenceRequired(lineId)
    const curr = ld.currency instanceof Decimal ? ld.currency : new Decimal(ld.currency ?? 0)
    const ess = essence instanceof Decimal ? essence : new Decimal(ess ?? 0)
    const costTotal = costOne.times(n)
    const essenceTotal = n * essenceReq
    if (!curr.gte(costTotal) || !ess.gte(essenceTotal)) return

    const newGenerators = [...gens]
    const prevCount = gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)
    newGenerators[genIndex] = {
      ...gen,
      count: prevCount.plus(n),
      cycleStartTime: prevCount.eq(0) ? Date.now() : (gen.cycleStartTime || Date.now())
    }
    setLineData(prev => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        currency: curr.minus(costTotal),
        generators: newGenerators,
      },
    }))
    const newEss = ess.minus(essenceTotal)
    setEssence(newEss)
    essenceRef.current = newEss
  }

  const getEffectiveCycleTime = (gen, lineId = activeProductionLine) => {
    const base = getCycleTimeMsForLine(lineId, gen.id)
    const rank = halfCycleRanks[gen.id] ?? 0
    if (rank === 0) return base
    return Math.max(MIN_CYCLE_MS, base / Math.pow(2, rank))
  }
  const getMaxHalfCycleRank = (gen) => Math.ceil(Math.log2(getCycleTimeMsForLine(activeProductionLine, gen.id) / MIN_CYCLE_MS))
  const getProductionMultiplierDisplay = (genId) => Math.pow(2, doubleProductionRanks[genId] ?? 0)

  // Custo da melhoria: genId * nextRank — G1 base 1 (+1 por ranque), G2 base 2 (+2), G3 base 3 (+3)...
  const getUpgradeCost = (genId, nextRank) => genId * nextRank

  const buyUpgrade = (type, genId) => {
    const lineId = activeProductionLine
    const ld = lineData[lineId]
    if (!ld) return
    const gen = (ld.generators ?? []).find(g => g.id === genId)
    if (!gen) return
    const hr = ld.halfCycleRanks ?? {}
    const dr = ld.doubleProductionRanks ?? {}
    if (type === 'halfCycle') {
      const rank = hr[genId] ?? 0
      const maxRank = getMaxHalfCycleRank(gen)
      if (rank >= maxRank) return
      const cost = getUpgradeCost(genId, rank + 1)
      if ((insights instanceof Decimal ? insights.toNumber() : insights) < cost) return
      setInsights(i => i.minus(cost))
      setLineData(prev => ({
        ...prev,
        [lineId]: {
          ...prev[lineId],
          halfCycleRanks: { ...prev[lineId]?.halfCycleRanks, [genId]: rank + 1 },
        },
      }))
    } else if (type === 'doubleProduction') {
      const rank = dr[genId] ?? 0
      const cost = getUpgradeCost(genId, rank + 1)
      if ((insights instanceof Decimal ? insights.toNumber() : insights) < cost) return
      setInsights(i => i.minus(cost))
      setLineData(prev => ({
        ...prev,
        [lineId]: {
          ...prev[lineId],
          doubleProductionRanks: { ...prev[lineId]?.doubleProductionRanks, [genId]: rank + 1 },
        },
      }))
    }
  }

  const claimAtomosUpgrade = (lineId) => {
    const ld = lineData[lineId]
    if (!ld) return
    const currency = ld.currency instanceof Decimal ? ld.currency : new Decimal(ld.currency ?? 0)
    const atomosClaimed = ld.atomosClaimed ?? 0
    const nextAtomCost = getAtomUpgradeCost(atomosClaimed)
    if (!currency.gte(nextAtomCost)) return
    setLineData(prev => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        currency: currency.minus(nextAtomCost),
        atomosClaimed: atomosClaimed + 1,
      },
    }))
  }

  const getClaimableAtomosTotal = () => {
    let total = 0
    for (const line of PRODUCTION_LINES) {
      const ld = lineData[line.id]
      if (!ld) continue
      let currency = ld.currency instanceof Decimal ? ld.currency : new Decimal(ld.currency ?? 0)
      let idx = ld.atomosClaimed ?? 0
      let claimed = 0
      while (currency.gte(getAtomUpgradeCost(idx))) {
        currency = currency.minus(getAtomUpgradeCost(idx))
        claimed++
        idx++
      }
      total += claimed
    }
    return total
  }

  // Total de insights resgatáveis a partir de um snapshot de lineData (ex.: pós-offline)
  const getClaimableInsightsTotalFromLineData = (lineDataSnapshot) => {
    let total = 0
    for (const line of PRODUCTION_LINES) {
      const ld = lineDataSnapshot[line.id]
      if (!ld?.generators) continue
      const insightMult = line.insightMultiplier ?? 1
      const ms = ld.milestonesClaimed ?? {}
      for (const gen of ld.generators) {
        const count = gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)
        if (!count.gt(0)) continue
        let nextIndex = ms[gen.id] ?? 0
        let claimed = 0
        while (count.gte(getMilestone(nextIndex))) {
          claimed++
          nextIndex++
        }
        if (claimed > 0) {
          const baseInsights = (claimed * (2 * nextIndex - claimed + 1)) / 2
          total += Math.floor(baseInsights * insightMult)
        }
      }
    }
    return total
  }

  // Resgata todos os marcos de todas as linhas (insights)
  const claimAllMilestones = () => {
    const updates = {}
    let totalInsights = 0
    for (const line of PRODUCTION_LINES) {
      const ld = lineData[line.id]
      if (!ld?.generators) continue
      const insightMult = line.insightMultiplier ?? 1
      const ms = ld.milestonesClaimed ?? {}
      const newMs = { ...ms }
      for (const gen of ld.generators) {
        const count = gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)
        if (!count.gt(0)) continue
        let nextIndex = ms[gen.id] ?? 0
        let claimed = 0
        while (count.gte(getMilestone(nextIndex))) {
          claimed++
          nextIndex++
        }
        if (claimed > 0) {
          const baseInsights = (claimed * (2 * nextIndex - claimed + 1)) / 2
          totalInsights += Math.floor(baseInsights * insightMult)
          newMs[gen.id] = nextIndex
        }
      }
      updates[line.id] = { ...ld, milestonesClaimed: newMs }
    }
    if (totalInsights > 0) setInsights((i) => i.plus(totalInsights))
    if (Object.keys(updates).length > 0) {
      setLineData((prev) => {
        const next = { ...prev }
        for (const k of Object.keys(updates)) next[k] = updates[k]
        return next
      })
    }
  }

  // Soma total de insights resgatáveis de uma linha (todos os geradores com marcos pendentes)
  const getClaimableInsightsForLine = (lineId) => {
    const ld = lineData[lineId]
    if (!ld?.generators) return 0
    const insightMult = PRODUCTION_LINES.find(l => l.id === lineId)?.insightMultiplier ?? 1
    const ms = ld.milestonesClaimed ?? {}
    let total = 0
    for (const gen of ld.generators) {
      const count = gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)
      if (!count.gt(0)) continue
      let nextIndex = ms[gen.id] ?? 0
      let claimed = 0
      while (count.gte(getMilestone(nextIndex))) {
        claimed++
        nextIndex++
      }
      if (claimed > 0) {
        const baseInsights = (claimed * (2 * nextIndex - claimed + 1)) / 2
        total += Math.floor(baseInsights * insightMult)
      }
    }
    return total
  }

  const claimMilestone = (genId) => {
    const lineId = activeProductionLine
    const ld = lineData[lineId]
    if (!ld) return
    const gen = (ld.generators ?? []).find(g => g.id === genId)
    if (!gen) return
    const count = gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)
    const ms = ld.milestonesClaimed ?? {}
    let nextIndex = ms[genId] ?? 0
    let claimed = 0
    while (count.gte(getMilestone(nextIndex))) {
      claimed++
      nextIndex++
    }
    if (claimed > 0) {
      const baseInsights = (claimed * (2 * nextIndex - claimed + 1)) / 2
      const insightMult = PRODUCTION_LINES.find(l => l.id === lineId)?.insightMultiplier ?? 1
      const totalInsights = Math.floor(baseInsights * insightMult)
      setInsights(i => i.plus(totalInsights))
      setLineData(prev => ({
        ...prev,
        [lineId]: {
          ...prev[lineId],
          milestonesClaimed: { ...prev[lineId]?.milestonesClaimed, [genId]: nextIndex },
        },
      }))
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans select-none">
      <main className="flex-1 flex flex-col min-h-screen bg-background/50">
        {/* Wrapper: 10px padding em todos os lados */}
        <div className="flex-1 flex flex-col min-h-0 p-2.5 w-full max-w-full">
          {/* Content: scrollável */}
          <OverlayScrollArea className="flex-1 min-w-0 min-h-0 pb-20">
            <div className="space-y-6 w-full p-2.5" style={{ minWidth: 0, boxSizing: 'border-box' }}>
              {/* Header + progresso + tabs — visíveis em Geradores e Melhorias */}
              <div className="flex flex-col gap-4 w-full min-w-0 overflow-visible">
                {/* Card Insights + FPS */}
                <div
                  className={cn(
                    "relative w-full h-8 rounded-lg flex items-center justify-between gap-3 px-3 overflow-hidden border border-zinc-500/60 shadow-md",
                    "text-white text-sm font-medium tabular-nums [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]"
                  )}
                >
                  <div className="absolute inset-0 flex flex-col pointer-events-none">
                    <div className="flex-1 min-h-0 bg-zinc-600/60" />
                    <div className="flex-1 min-h-0 bg-zinc-700/90" />
                  </div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 shrink-0 text-violet-300" />
                      <span>{format(insights)}</span>
                    </div>
                    <div className="flex items-center gap-2" title={`Átomos (${atomsPerSecond}/s)`}>
                      <Atom className="w-4 h-4 shrink-0 text-cyan-300" />
                      <span>{format(essence)}</span>
                      <span className="text-cyan-300/80 text-xs">(+{atomsPerSecond}/s)</span>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center gap-2" title="Frames por segundo">
                    <span
                      className={cn(
                        "tabular-nums font-mono",
                        fps >= 60 && "text-emerald-400",
                        fps >= 30 && fps < 60 && "text-amber-400",
                        fps < 30 && "text-red-400"
                      )}
                    >
                      {fps} FPS
                    </span>
                  </div>
                </div>
                {/* Card global: progresso até limite break_infinity.js */}
                <div className="relative w-full h-8 rounded-lg overflow-hidden border border-zinc-600/60">
                  <div className="absolute inset-0 flex flex-col pointer-events-none">
                    <div className="flex-1 min-h-0 bg-zinc-600/60" />
                    <div className="flex-1 min-h-0 bg-zinc-700/90" />
                  </div>
                  <div
                    className="absolute inset-y-0 left-0 rounded-l-lg overflow-hidden flex flex-col pointer-events-none"
                    style={{ width: `${breakInfinityProgress}%`, minWidth: breakInfinityProgress > 0 ? '4px' : 0 }}
                  >
                    <div className="flex-1 min-h-0 bg-violet-500" />
                    <div className="flex-1 min-h-0 bg-violet-600" />
                  </div>
                  <div className="absolute inset-0 grid grid-cols-3 items-center px-3 text-white select-none pointer-events-none z-10 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center gap-2 text-xs font-medium tabular-nums text-white/95 truncate text-left">
                      <UniversalResourceIcon />
                      <span className="truncate">{format(universalResource)}</span>
                    </div>
                    <div className="flex justify-center">
                      <span className="text-xs font-medium tabular-nums text-white/95 text-center truncate max-w-full">
                        {timeToBreakInfinityLimit}
                      </span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-white/95 text-right">
                      {breakInfinityProgress < 0.01 && breakInfinityProgress > 0 ? '<0.01' : breakInfinityProgress.toFixed(2)}%
                    </span>
                  </div>
                </div>
                {/* Cards de seleção de linha de produção (escondidos na aba Átomos) */}
                {tab !== 'atomos' && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 2xl:grid-cols-10 gap-2 overflow-visible">
                    {PRODUCTION_LINES.map((line) => {
                      const ld = lineData[line.id]
                      const curr = ld?.currency instanceof Decimal ? ld.currency : new Decimal(ld?.currency ?? 0)
                      const LineIcon = line.icon
                      const isActive = activeProductionLine === line.id
                      const claimableInsights = getClaimableInsightsForLine(line.id)
                      return (
                        <div key={line.id} className="relative overflow-visible">
                          <button
                            type="button"
                            onClick={() => setActiveProductionLine(line.id)}
                            className={cn(
                              "relative w-full h-8 rounded-lg flex items-center justify-center gap-2 overflow-hidden border transition-all px-3",
                              LINE_STYLE.border,
                              isActive
                                ? "ring-2 ring-offset-2 ring-offset-background ring-white/50 shadow-md"
                                : "opacity-75 hover:opacity-100"
                            )}
                          >
                            <div className="absolute inset-0 flex flex-col pointer-events-none">
                              <div className={cn("flex-1 min-h-0", LINE_STYLE.track)} />
                              <div className={cn("flex-1 min-h-0", LINE_STYLE.trackDark)} />
                            </div>
                            {canBuyLineG1(line.id) ? (
                              <>
                                <LineIcon className="relative z-10 w-3.5 h-3.5 shrink-0 text-white/95" strokeWidth={2} />
                                <span className="relative z-10 text-xs font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
                                  {line.label}
                                </span>
                                <span className="relative z-10 text-xs font-medium tabular-nums text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)] truncate">
                                  {format(curr)}
                                </span>
                              </>
                            ) : (
                              <Lock className="relative z-10 w-3.5 h-3.5 shrink-0 text-white/95" strokeWidth={2} />
                            )}
                          </button>
                          {claimableInsights > 0 && (
                            <span className="absolute top-1 right-1 min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-md bg-white shadow-md border border-violet-200/80 text-[11px] font-bold text-violet-700 tabular-nums z-20 pointer-events-none">
                              {claimableInsights}
                            </span>
                          )}
                          {canAffordNextGenerator(line.id) && (
                            <span className="absolute top-1 left-1 min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-md bg-emerald-500 shadow-md border border-emerald-400/80 text-[11px] font-bold text-white z-20 pointer-events-none">
                              !
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {tab === 'generators' && (
                <div className="flex flex-col gap-3 w-full min-w-0 overflow-visible">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['1x', '1%', '10%', '50%', '100%']).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setBuyMode(mode)}
                        className={cn(
                          "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                          buyMode === mode
                            ? "bg-amber-500/90 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]"
                            : "bg-white/10 text-white/80 hover:bg-white/20 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  {generators
                    .filter((gen) => {
                      const count = gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)
                      if (count.gt(0)) return true
                      const maxPurchasedId = Math.max(0, ...generators.filter((g) => (g.count instanceof Decimal ? g.count : new Decimal(g.count ?? 0)).gt(0)).map((g) => g.id))
                      return gen.id === maxPurchasedId + 1
                    })
                    .map(gen => {
                      const upperGen = generators.find(g => g.id === gen.id + 1)
                      const upperCount = upperGen ? (upperGen.count instanceof Decimal ? upperGen.count : new Decimal(upperGen.count ?? 0)) : new Decimal(0)
                      const isAutomated = upperCount.gt(0)
                      const currentCost = getCost(gen)
                      const essenceRequired = getEssenceRequired(activeProductionLine)
                      const ess = essence instanceof Decimal ? essence : new Decimal(essence ?? 0)
                      const canAfford = currency.gte(currentCost) && ess.gte(essenceRequired)
                      const buyQty = buyMode === '1x' ? 1 : getBuyCount(buyMode, gen, activeProductionLine)
                      const displayQty = buyQty > 0 ? buyQty : 1
                      const displayCost = currentCost.times(displayQty)
                      const displayEssence = essenceRequired * displayQty
                      const canBuyG1 = gen.id === 1 ? canBuyLineG1(activeProductionLine) : true
                      const lineIdx = PRODUCTION_LINES.findIndex(l => l.id === activeProductionLine)
                      const g1RequirementText = gen.id === 1 && lineIdx > 0
                        ? `Requisito: automatize o Gerador ${lineIdx + 1} da linha anterior`
                        : null
                      const activeLine = PRODUCTION_LINES.find(l => l.id === activeProductionLine)
                      const colors = LINE_STYLE
                      const LineShapeIcon = activeLine?.icon ?? Circle
                      const count = gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)
                      const nextMilestoneIndex = milestonesClaimed[gen.id] ?? 0
                      const nextMilestone = getMilestone(nextMilestoneIndex)
                      const milestoneProgress = count.gte(nextMilestone)
                        ? 100
                        : Math.min(100, count.div(nextMilestone).times(100).toNumber())
                      const canClaimMilestone = count.gte(nextMilestone)
                      // Pontos de melhoria (insights) que serão resgatados — mesma fórmula de claimMilestone
                      let claimed = 0
                      let idx = nextMilestoneIndex
                      while (count.gte(getMilestone(idx))) {
                        claimed++
                        idx++
                      }
                      const insightMult = PRODUCTION_LINES.find(l => l.id === activeProductionLine)?.insightMultiplier ?? 1
                      const claimableInsights = claimed > 0 ? Math.floor((claimed * (2 * idx - claimed + 1)) / 2 * insightMult) : 0

                      return (
                        <div key={gen.id} className="flex items-center gap-3 w-full min-w-0 overflow-visible">
                          {count.eq(0) ? (
                            /* Ícone do gerador fora + card de desbloqueio */
                            <>
                              <div
                                className={cn(
                                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                  LINE_ICON_COLORS[activeProductionLine] ?? 'bg-sky-500'
                                )}
                              >
                                <LineShapeIcon className="h-6 w-6 text-white/90" strokeWidth={2.5} />
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                                  {gen.id}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (canAfford && canBuyG1) buyGenerator(gen.id)
                                  else if (canAfford && !canBuyG1 && g1RequirementText) window.alert(g1RequirementText)
                                }}
                                className={cn(
                                  "relative flex-1 min-w-0 h-8 rounded-lg flex items-center justify-center gap-3 px-4 transition-opacity overflow-hidden appearance-none bg-transparent cursor-pointer",
                                  colors.border,
                                  "border"
                                )}
                              >
                                <div className="absolute inset-0 flex flex-col pointer-events-none">
                                  <div className={cn("flex-1 min-h-0", colors.track)} />
                                  <div className={cn("flex-1 min-h-0", colors.trackDark ?? colors.track)} />
                                </div>
                                <span className="relative z-10 text-xs text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
                                  {gen.id === 1 && !canBuyG1 && g1RequirementText ? g1RequirementText : 'Desbloqueie para começar a produzir'}
                                </span>
                                <span className="relative z-10 w-px h-4 bg-white/30 shrink-0" aria-hidden />
                                <span className="relative z-10 flex items-center gap-2 text-xs text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
                                  <span className="flex items-center gap-1">
                                    <Coins className="w-4 h-4 shrink-0 text-amber-300/90" />
                                    <span className={cn("tabular-nums font-medium", !currency.gte(displayCost) && "text-red-400", currency.gte(displayCost) && canBuyG1 && "text-emerald-400")}>{formatCost(displayCost)}</span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Atom className="w-4 h-4 shrink-0 text-cyan-300/90" />
                                    <span className={cn("tabular-nums font-medium", !ess.gte(displayEssence) && "text-red-400", ess.gte(displayEssence) && canBuyG1 && "text-emerald-400")}>{format(displayEssence)}</span>
                                  </span>
                                  {buyMode !== '1x' && getBuyCount(buyMode, gen, activeProductionLine) > 0 && (
                                    <span className="tabular-nums font-medium text-white/95">
                                      · Comprar {format(getBuyCount(buyMode, gen, activeProductionLine))}
                                    </span>
                                  )}
                                </span>
                              </button>
                            </>
                          ) : (
                            <>
                              <div
                                className={cn(
                                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                  LINE_ICON_COLORS[activeProductionLine] ?? 'bg-sky-500'
                                )}
                              >
                                <LineShapeIcon className="h-6 w-6 text-white/90" strokeWidth={2.5} />
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                                  {gen.id}
                                </span>
                              </div>
                              <div className="relative h-8 w-[5.5rem] shrink-0 overflow-visible">
                                <button
                                  type="button"
                                  onClick={() => claimMilestone(gen.id)}
                                  disabled={!canClaimMilestone}
                                  className={cn(
                                    "relative w-full h-full rounded-lg overflow-hidden border text-left cursor-pointer transition-opacity",
                                    MILESTONE_COLORS.border,
                                    canClaimMilestone && "ring-2 ring-violet-400 ring-offset-2 ring-offset-background"
                                  )}
                                >
                                  <div className="absolute inset-0 flex flex-col pointer-events-none">
                                    <div className={cn("flex-1 min-h-0", MILESTONE_COLORS.track)} />
                                    <div className={cn("flex-1 min-h-0", MILESTONE_COLORS.trackDark)} />
                                  </div>
                                  <div
                                    className="absolute inset-y-0 left-0 rounded-l-lg overflow-hidden flex flex-col pointer-events-none"
                                    style={{
                                      width: `${milestoneProgress}%`,
                                      minWidth: milestoneProgress > 0 ? '4px' : 0,
                                    }}
                                  >
                                    <div className={cn("flex-1 min-h-0", MILESTONE_COLORS.fill)} />
                                    <div className={cn("flex-1 min-h-0", MILESTONE_COLORS.fillDark)} />
                                  </div>
                                  <span className="absolute inset-0 flex items-center justify-center px-1 text-white text-xs font-semibold [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)] pointer-events-none">
                                    {format(gen.count)}
                                  </span>
                                </button>
                                {claimableInsights > 0 && (
                                  <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-md bg-white shadow-md border border-violet-200/80 text-[11px] font-bold text-violet-700 tabular-nums z-10">
                                    {claimableInsights}
                                  </span>
                                )}
                              </div>
                              <div
                                className={cn(
                                  "relative flex-1 min-w-0 w-full h-8 rounded-lg overflow-hidden border",
                                  colors.border
                                )}
                              >
                                <div className="absolute inset-0 flex flex-col pointer-events-none">
                                  <div className={cn("flex-1 min-h-0", colors.track)} />
                                  <div className={cn("flex-1 min-h-0", colors.trackDark ?? colors.track)} />
                                </div>
                                <SmoothBar
                                  cycleStartTime={gen.cycleStartTime || 0}
                                  cycleTimeMs={getEffectiveCycleTime(gen)}
                                  active={count.gt(0)}
                                  fillClassName={cn("rounded-none", colors.fill)}
                                  fillDarkClassName={colors.fillDark ? cn("rounded-none", colors.fillDark) : undefined}
                                  phaseSeed={(PRODUCTION_LINES.findIndex(l => l.id === activeProductionLine) * 31 + gen.id) * 97}
                                />
                                <div
                                  className="absolute inset-0 flex items-center justify-between px-3 text-white select-none pointer-events-none z-10 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]"
                                >
                                  <span className="text-xs font-medium text-white/95 tabular-nums w-[4.5rem] shrink-0 text-left">
                                    {getEffectiveCycleTime(gen) > 1000 ? formatTime(getEffectiveCycleTime(gen) / 1000) : ''}
                                  </span>
                                  <span className="text-xs font-medium text-white/95 truncate w-[7.5rem] shrink-0 text-right">
                                    {(() => {
                                      const mult = getProductionMultiplierDisplay(gen.id)
                                      const baseProd = getBaseProductionForLine(activeProductionLine, gen.id)
                                      const prodPerCycle = count.times(mult).times(baseProd)
                                      const cycleSec = getEffectiveCycleTime(gen) / 1000
                                      if (cycleSec <= 1) {
                                        const prodPerSec = prodPerCycle.div(cycleSec)
                                        return format(prodPerSec) + '/s'
                                      }
                                      return `+${format(prodPerCycle)} ${gen.id === 1 ? 'recurso' : generators.find(g => g.id === gen.id - 1)?.name ?? `Gerador ${gen.id - 1}`}`
                                    })()}
                                  </span>
                                </div>
                              </div>
                              {isAutomated ? (
                                <div
                                  className={cn(
                                    "relative h-8 w-[calc(100px+0.75rem+11rem)] shrink-0 rounded-lg flex items-center justify-center px-4 overflow-hidden border border-amber-400/50",
                                    "text-white text-xs font-medium [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]"
                                  )}
                                >
                                  <div className="absolute inset-0 flex flex-col pointer-events-none">
                                    <div className="flex-1 min-h-0 bg-amber-500/90 dark:bg-amber-500/90" />
                                    <div className="flex-1 min-h-0 bg-amber-600/95 dark:bg-amber-700/95" />
                                  </div>
                                  <span className="relative z-10 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">Automatizado</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => canAfford && buyGenerator(gen.id)}
                                  disabled={!canAfford}
                                  className={cn(
                                    "relative h-8 w-[calc(100px+0.75rem+11rem)] shrink-0 rounded-lg flex items-center justify-between gap-2 px-3 overflow-hidden border text-xs font-medium tabular-nums",
                                    colors.border,
                                    canAfford
                                      ? "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]"
                                      : "text-zinc-200 cursor-not-allowed disabled:opacity-95"
                                  )}
                                  title={`${formatCost(displayCost)} + ${format(displayEssence)} Átomo`}
                                >
                                  <div className="absolute inset-0 flex flex-col pointer-events-none">
                                    {canAfford ? (
                                      <>
                                        <div className="flex-1 min-h-0 bg-emerald-500" />
                                        <div className="flex-1 min-h-0 bg-emerald-700" />
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex-1 min-h-0 bg-zinc-600" />
                                        <div className="flex-1 min-h-0 bg-zinc-700" />
                                      </>
                                    )}
                                  </div>
                                  <span className="relative z-10">
                                    {buyMode === '1x' || getBuyCount(buyMode, gen, activeProductionLine) === 0
                                      ? 'Comprar'
                                      : `Comprar ${format(getBuyCount(buyMode, gen, activeProductionLine))}`}
                                  </span>
                                  <div className="relative z-10 flex items-center gap-1.5 truncate">
                                    <Coins className="w-4 h-4 shrink-0 text-amber-300/90" />
                                    <span className={cn("tabular-nums truncate", !currency.gte(displayCost) && "text-red-400")}>
                                      {formatCost(displayCost)}
                                    </span>
                                    <span className="text-white/60">+</span>
                                    <Atom className="w-4 h-4 shrink-0 text-cyan-300/90" />
                                    <span className={cn("tabular-nums truncate", !ess.gte(displayEssence) && "text-red-400")}>
                                      {format(displayEssence)}
                                    </span>
                                  </div>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}

              {tab === 'upgrades' && (
                <div className="flex flex-col gap-4">
                  {generators
                    .filter((gen) => (gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)).gt(0))
                    .map((gen) => {
                      const activeLine = PRODUCTION_LINES.find(l => l.id === activeProductionLine)
                      const colors = LINE_STYLE
                      const LineShapeIcon = activeLine?.icon ?? Circle
                      const halfRank = halfCycleRanks[gen.id] ?? 0
                      const prodRank = doubleProductionRanks[gen.id] ?? 0
                      const maxHalfRank = getMaxHalfCycleRank(gen)
                      const halfAtMax = halfRank >= maxHalfRank
                      const halfCost = getUpgradeCost(gen.id, halfRank + 1)
                      const prodCost = getUpgradeCost(gen.id, prodRank + 1)
                      const insightsNum = insights instanceof Decimal ? insights.toNumber() : insights

                      const toRoman = (n) => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n - 1] ?? String(n)

                      return (
                        <div
                          key={gen.id}
                          className={cn(
                            "relative overflow-hidden rounded-lg border transition-all duration-300",
                            colors.border
                          )}
                        >
                          <div className="absolute inset-0 flex flex-col pointer-events-none">
                            <div className={cn("flex-1 min-h-0", colors.track)} />
                            <div className={cn("flex-1 min-h-0", colors.trackDark ?? colors.track)} />
                          </div>
                          {/* Header do gerador */}
                          <div className={cn("relative z-10 flex items-center gap-3 px-4 py-3", colors.track, "bg-white/5")}>
                            <div
                              className={cn(
                                "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white",
                                LINE_ICON_COLORS[activeProductionLine] ?? 'bg-sky-500'
                              )}
                            >
                              <LineShapeIcon className="h-6 w-6 text-white/90" strokeWidth={2.5} />
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                                {gen.id}
                              </span>
                            </div>
                            <span className="font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">{gen.name}</span>
                          </div>

                          <div className="relative z-10 grid gap-0 sm:grid-cols-2 p-0">
                            <UpgradeCard
                              cardClassName="border-b sm:border-b-0 sm:border-r border-white/20"
                              trackClassName={colors.track}
                              trackDarkClassName={colors.trackDark ?? colors.track}
                              fillClassName={colors.fill}
                              format={format}
                              icon={Timer}
                              title="½ ciclo"
                              rankText={halfAtMax ? `Ranque ${toRoman(halfRank)} · Máx` : `Ranque ${toRoman(halfRank)} → ${toRoman(halfRank + 1)}`}
                              desc="Reduz o tempo do ciclo pela metade (mín. 0,1s)"
                              effect={halfAtMax ? '0,1s (Máximo)' : formatTime(Math.max(0.1, getCycleTimeMsForLine(activeProductionLine, gen.id) / 1000 / Math.pow(2, halfRank))) + ' → ' + formatTime(Math.max(0.1, getCycleTimeMsForLine(activeProductionLine, gen.id) / 1000 / Math.pow(2, halfRank + 1)))}
                              cost={halfCost}
                              atMax={halfAtMax}
                              canBuy={insightsNum >= halfCost}
                              onBuy={() => buyUpgrade('halfCycle', gen.id)}
                            />
                            <UpgradeCard
                              cardClassName=""
                              trackClassName={colors.track}
                              trackDarkClassName={colors.trackDark ?? colors.track}
                              fillClassName={colors.fill}
                              format={format}
                              icon={TrendingUp}
                              title="2× prod"
                              rankText={`Ranque ${prodRank > 0 ? toRoman(prodRank) : '0'} → ${toRoman(prodRank + 1)}`}
                              desc="Dobra a produção"
                              effect={`${format(Math.pow(2, prodRank))}× → ${format(Math.pow(2, prodRank + 1))}×`}
                              cost={prodCost}
                              atMax={false}
                              canBuy={insightsNum >= prodCost}
                              onBuy={() => buyUpgrade('doubleProduction', gen.id)}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}

              {tab === 'atomos' && (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PRODUCTION_LINES.map((line) => {
                      const ld = lineData[line.id]
                      const currency = ld?.currency instanceof Decimal ? ld.currency : new Decimal(ld?.currency ?? 0)
                      const atomosClaimed = ld?.atomosClaimed ?? 0
                      const nextAtomCost = getAtomUpgradeCost(atomosClaimed)
                      const canClaim = currency.gte(nextAtomCost)
                      const progress = nextAtomCost.gt(0) ? Math.min(100, currency.div(nextAtomCost).times(100).toNumber()) : 100
                      const LineIcon = line.icon
                      return (
                        <button
                          key={line.id}
                          type="button"
                          onClick={() => canClaim && claimAtomosUpgrade(line.id)}
                          disabled={!canClaim}
                          className={cn(
                            "relative overflow-hidden rounded-lg border transition-all text-left",
                            LINE_STYLE.border,
                            canClaim ? "ring-2 ring-cyan-400/60 ring-offset-2 ring-offset-background cursor-pointer hover:opacity-95" : "opacity-90 cursor-default"
                          )}
                        >
                          <div className="absolute inset-0 flex flex-col pointer-events-none">
                            <div className={cn("flex-1 min-h-0", LINE_STYLE.track)} />
                            <div className={cn("flex-1 min-h-0", LINE_STYLE.trackDark)} />
                          </div>
                          <div className="relative z-10 p-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                  LINE_ICON_COLORS[line.id] ?? 'bg-sky-500'
                                )}
                              >
                                <LineIcon className="h-5 w-5 text-white" strokeWidth={2.5} />
                              </div>
                              <span className="font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                                {line.label}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-cyan-300/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                                +1 átomo/s
                              </span>
                              <span className="text-xs text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                                Custo {format(nextAtomCost)}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", canClaim ? "bg-cyan-500" : "bg-cyan-500/50")}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            {canClaim ? (
                              <span className="text-xs font-medium text-cyan-300 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                                Clique para trocar
                              </span>
                            ) : (
                              <span className="text-xs text-white/60 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                                {format(currency)} / {format(nextAtomCost)}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </OverlayScrollArea>
        </div>

        {/* Bottom: Abas Geradores | Melhorias | Configurações */}
        <div className="shrink-0 fixed bottom-0 left-0 right-0 flex justify-center gap-2 p-4 pt-2 bg-background/95 z-30">
          <button
            type="button"
            onClick={() => setTab('generators')}
            className={cn(
              "relative h-8 rounded-lg flex items-center justify-center gap-2 overflow-hidden border transition-all px-4 appearance-none bg-transparent",
              LINE_STYLE.border,
              tab === 'generators' ? "ring-2 ring-offset-2 ring-offset-background ring-white/50 shadow-md" : "opacity-75 hover:opacity-100"
            )}
          >
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              <div className={cn("flex-1 min-h-0", LINE_STYLE.track)} />
              <div className={cn("flex-1 min-h-0", LINE_STYLE.trackDark)} />
            </div>
            <Zap className="relative z-10 w-4 h-4 shrink-0 text-white/95" strokeWidth={2} />
            <span className="relative z-10 text-xs font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
              Geradores
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('upgrades')}
            className={cn(
              "relative h-8 rounded-lg flex items-center justify-center gap-2 overflow-hidden border transition-all px-4 appearance-none bg-transparent",
              LINE_STYLE.border,
              tab === 'upgrades' ? "ring-2 ring-offset-2 ring-offset-background ring-white/50 shadow-md" : "opacity-75 hover:opacity-100"
            )}
          >
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              <div className={cn("flex-1 min-h-0", LINE_STYLE.track)} />
              <div className={cn("flex-1 min-h-0", LINE_STYLE.trackDark)} />
            </div>
            <Brain className="relative z-10 w-4 h-4 shrink-0 text-violet-300" strokeWidth={2} />
            <span className="relative z-10 text-xs font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
              Melhorias
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('atomos')}
            className={cn(
              "relative h-8 rounded-lg flex items-center justify-center gap-2 overflow-hidden border transition-all px-4 appearance-none bg-transparent",
              LINE_STYLE.border,
              tab === 'atomos' ? "ring-2 ring-offset-2 ring-offset-background ring-white/50 shadow-md" : "opacity-75 hover:opacity-100"
            )}
          >
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              <div className={cn("flex-1 min-h-0", LINE_STYLE.track)} />
              <div className={cn("flex-1 min-h-0", LINE_STYLE.trackDark)} />
            </div>
            <Atom className="relative z-10 w-4 h-4 shrink-0 text-cyan-300" strokeWidth={2} />
            <span className="relative z-10 text-xs font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
              Átomos
            </span>
            {getClaimableAtomosTotal() > 0 && (
              <span className="relative z-10 min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-md bg-white shadow-md border border-cyan-200/80 text-[11px] font-bold text-cyan-600 tabular-nums">
                {getClaimableAtomosTotal()}
              </span>
            )}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsOpen(v => !v)}
              title="Configurações"
              className={cn(
                "relative h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden border transition-all appearance-none bg-transparent",
                LINE_STYLE.border,
                "opacity-75 hover:opacity-100"
              )}
            >
              <div className="absolute inset-0 flex flex-col pointer-events-none">
                <div className={cn("flex-1 min-h-0", LINE_STYLE.track)} />
                <div className={cn("flex-1 min-h-0", LINE_STYLE.trackDark)} />
              </div>
              <MoreVertical className="relative z-10 w-4 h-4 text-white/95" strokeWidth={2} />
            </button>
            {settingsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSettingsOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 bottom-full mb-2 z-50 min-w-[10rem] rounded-lg border bg-card p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false)
                      setResetDialogOpen(true)
                    }}
                    className="w-full rounded px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-destructive transition-colors [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]"
                  >
                    Resetar jogo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {offlineDialog?.show && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" aria-hidden onClick={() => setOfflineDialog((d) => d && { ...d, show: false })} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-600/80 bg-zinc-900 shadow-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Bem-vindo de volta!</h3>
            <p className="text-xs text-white/80 mb-3">
              Enquanto você estava fora ({formatTime(offlineDialog.durationMs / 1000)}):
            </p>
            <ul className="space-y-1.5 mb-4 max-h-[20rem] overflow-y-auto">
              {PRODUCTION_LINES.map((line) => {
                const gain = offlineDialog.gains[line.id]
                const val = gain instanceof Decimal ? gain : new Decimal(gain ?? 0)
                if (val.lte(0)) return null
                const LineIcon = line.icon
                return (
                  <li key={line.id} className="flex items-center gap-2 text-xs text-white/90">
                    <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", LINE_ICON_COLORS[line.id] ?? 'bg-sky-500')}>
                      <LineIcon className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                    </div>
                    <span className="font-medium">{line.label}</span>
                    <span className="tabular-nums text-white ml-auto">+{format(val)}</span>
                  </li>
                )
              })}
              {offlineDialog.atoms && offlineDialog.atoms.gt && offlineDialog.atoms.gt(0) && (
                <li className="flex items-center gap-2 text-xs text-white/90">
                  <Atom className="h-5 w-5 shrink-0 text-cyan-300" />
                  <span className="font-medium">Átomos</span>
                  <span className="tabular-nums text-cyan-300 ml-auto">+{format(offlineDialog.atoms)}</span>
                </li>
              )}
              {offlineDialog.insights != null && offlineDialog.insights > 0 && (
                <li className="flex items-center gap-2 text-xs text-white/90">
                  <Brain className="h-5 w-5 shrink-0 text-violet-300" />
                  <span className="font-medium">Insights</span>
                  <span className="tabular-nums text-violet-300 ml-auto">+{offlineDialog.insights}</span>
                </li>
              )}
            </ul>
            <button
              type="button"
              onClick={() => {
                if (offlineDialog.insights != null && offlineDialog.insights > 0 && !offlineDialog.insightsClaimed) {
                  claimAllMilestones()
                }
                setOfflineDialog((d) => d && { ...d, show: false })
              }}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium"
            >
              {offlineDialog.insights != null && offlineDialog.insights > 0 && !offlineDialog.insightsClaimed
                ? 'Resgatar e continuar'
                : 'Continuar'}
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={resetGame}
        title="Resetar jogo"
        message="Todo o progresso será perdido. Deseja continuar?"
        confirmLabel="Resetar"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
      />
    </div>
  )
}

export default App
