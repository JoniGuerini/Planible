import { useState, useEffect, useRef } from 'react'
import Decimal from 'break_eternity.js'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Coins, Sparkle, Zap, Settings, MoreVertical, TrendingUp, Timer } from 'lucide-react'
import './App.css'

// Cores das barras por gerador (track = fundo, fill = preenchimento, border = borda)
const BAR_COLORS = {
  emerald: { track: 'bg-emerald-800/90 dark:bg-emerald-900/90', trackDark: 'bg-emerald-900/95 dark:bg-emerald-950/95', fill: 'bg-emerald-500', fillDark: 'bg-emerald-700', border: 'border-emerald-700/50 dark:border-emerald-800/50' },
  blue: { track: 'bg-blue-800/90 dark:bg-blue-900/90', trackDark: 'bg-blue-900/95 dark:bg-blue-950/95', fill: 'bg-blue-500', fillDark: 'bg-blue-700', border: 'border-blue-700/50 dark:border-blue-800/50' },
  sky: { track: 'bg-sky-800/90 dark:bg-sky-900/90', trackDark: 'bg-sky-900/95 dark:bg-sky-950/95', fill: 'bg-sky-500', fillDark: 'bg-sky-700', border: 'border-sky-700/50 dark:border-sky-800/50' },
  amber: { track: 'bg-amber-800/90 dark:bg-amber-900/90', trackDark: 'bg-amber-900/95 dark:bg-amber-950/95', fill: 'bg-amber-500', fillDark: 'bg-amber-700', border: 'border-amber-700/50 dark:border-amber-800/50' },
  rose: { track: 'bg-rose-800/90 dark:bg-rose-900/90', trackDark: 'bg-rose-900/95 dark:bg-rose-950/95', fill: 'bg-rose-500', fillDark: 'bg-rose-700', border: 'border-rose-700/50 dark:border-rose-800/50' },
  cyan: { track: 'bg-cyan-800/90 dark:bg-cyan-900/90', trackDark: 'bg-cyan-900/95 dark:bg-cyan-950/95', fill: 'bg-cyan-500', fillDark: 'bg-cyan-700', border: 'border-cyan-700/50 dark:border-cyan-800/50' },
  orange: { track: 'bg-orange-800/90 dark:bg-orange-900/90', trackDark: 'bg-orange-900/95 dark:bg-orange-950/95', fill: 'bg-orange-500', fillDark: 'bg-orange-700', border: 'border-orange-700/50 dark:border-orange-800/50' },
  lime: { track: 'bg-lime-800/90 dark:bg-lime-900/90', trackDark: 'bg-lime-900/95 dark:bg-lime-950/95', fill: 'bg-lime-500', fillDark: 'bg-lime-700', border: 'border-lime-700/50 dark:border-lime-800/50' },
  teal: { track: 'bg-teal-800/90 dark:bg-teal-900/90', trackDark: 'bg-teal-900/95 dark:bg-teal-950/95', fill: 'bg-teal-500', fillDark: 'bg-teal-700', border: 'border-teal-700/50 dark:border-teal-800/50' },
  indigo: { track: 'bg-indigo-800/90 dark:bg-indigo-900/90', trackDark: 'bg-indigo-900/95 dark:bg-indigo-950/95', fill: 'bg-indigo-500', fillDark: 'bg-indigo-700', border: 'border-indigo-700/50 dark:border-indigo-800/50' },
  violet: { track: 'bg-violet-800/90 dark:bg-violet-900/90', trackDark: 'bg-violet-900/95 dark:bg-violet-950/95', fill: 'bg-violet-500', fillDark: 'bg-violet-700', border: 'border-violet-700/50 dark:border-violet-800/50' },
  fuchsia: { track: 'bg-fuchsia-800/90 dark:bg-fuchsia-900/90', trackDark: 'bg-fuchsia-900/95 dark:bg-fuchsia-950/95', fill: 'bg-fuchsia-500', fillDark: 'bg-fuchsia-700', border: 'border-fuchsia-700/50 dark:border-fuchsia-800/50' },
  pink: { track: 'bg-pink-800/90 dark:bg-pink-900/90', trackDark: 'bg-pink-900/95 dark:bg-pink-950/95', fill: 'bg-pink-500', fillDark: 'bg-pink-700', border: 'border-pink-700/50 dark:border-pink-800/50' },
  // Vermelho: fundo #391213, barra #9F0712, sem borda
  red: {
    track: 'bg-[#391213]',
    trackDark: 'bg-[#2a0d0e]',
    fill: 'bg-[#9F0712]',
    fillDark: 'bg-[#7a0510]',
    border: 'border-transparent',
  },
  slate: { track: 'bg-slate-700/90 dark:bg-slate-800/90', trackDark: 'bg-slate-800/95 dark:bg-slate-900/95', fill: 'bg-slate-500', fillDark: 'bg-slate-600', border: 'border-slate-600/50 dark:border-slate-700/50' },
  stone: { track: 'bg-stone-700/90 dark:bg-stone-800/90', trackDark: 'bg-stone-800/95 dark:bg-stone-900/95', fill: 'bg-stone-500', fillDark: 'bg-stone-600', border: 'border-stone-600/50 dark:border-stone-700/50' },
  zinc: { track: 'bg-zinc-700/90 dark:bg-zinc-800/90', trackDark: 'bg-zinc-800/95 dark:bg-zinc-900/95', fill: 'bg-zinc-500', fillDark: 'bg-zinc-600', border: 'border-zinc-600/50 dark:border-zinc-700/50' },
  green: { track: 'bg-green-800/90 dark:bg-green-900/90', trackDark: 'bg-green-900/95 dark:bg-green-950/95', fill: 'bg-green-500', fillDark: 'bg-green-700', border: 'border-green-700/50 dark:border-green-800/50' },
  yellow: { track: 'bg-yellow-700/90 dark:bg-yellow-800/90', trackDark: 'bg-yellow-800/95 dark:bg-yellow-900/95', fill: 'bg-yellow-500', fillDark: 'bg-yellow-600', border: 'border-yellow-600/50 dark:border-yellow-700/50' },
  neutral: { track: 'bg-neutral-700/90 dark:bg-neutral-800/90', trackDark: 'bg-neutral-800/95 dark:bg-neutral-900/95', fill: 'bg-neutral-500', fillDark: 'bg-neutral-600', border: 'border-neutral-600/50 dark:border-neutral-700/50' },
}

// Barra de marcos: violeta (distinta das barras de progresso)
const MILESTONE_COLORS = {
  track: 'bg-violet-800/90 dark:bg-violet-900/90',
  trackDark: 'bg-violet-900/95 dark:bg-violet-950/95',
  fill: 'bg-violet-400 dark:bg-violet-400',
  fillDark: 'bg-violet-600 dark:bg-violet-600',
  border: 'border-violet-700/50 dark:border-violet-800/50',
}

// Custo base: G1 base 10/mult (segunda = 10), G2 = 100, G3 = 10k, G4 = 100 M — 10^(2^(id-1))
const G1_MULTIPLIER = 1.5 // +50% por unidade — torna spam manual menos viável
const getInitialCost = (id) => id === 1 ? new Decimal(10).div(G1_MULTIPLIER) : Decimal.pow(10, Math.pow(2, id - 1))

// Multiplicador por unidade: G1 +50%, G2 +60%, G3 +70%... — incentiva comprar geradores superiores
const getCostMultiplier = (genId) => G1_MULTIPLIER + (genId - 1) * 0.1

// Paleta: rosa (barras dos geradores) + violeta (marcos) + amber (automatizado)
const BAR_COLOR_KEYS = Array.from({ length: 20 }, () => 'rose')

// Linhas de produção — base dobra entre linhas (2s, 4s, 8s, 16s...), ratio (n+1)x entre geradores
const PRODUCTION_LINES = [
  { id: 'rose', color: 'rose', label: 'Rosa', cycleBaseMs: 2000, cycleRatio: 2, insightMultiplier: 1 },
  { id: 'emerald', color: 'emerald', label: 'Esmeralda', cycleBaseMs: 4000, cycleRatio: 3, insightMultiplier: 2 },
  { id: 'blue', color: 'blue', label: 'Azul', cycleBaseMs: 8000, cycleRatio: 4, insightMultiplier: 3 },
  { id: 'amber', color: 'amber', label: 'Âmbar', cycleBaseMs: 16000, cycleRatio: 5, insightMultiplier: 4 },
  { id: 'violet', color: 'violet', label: 'Violeta', cycleBaseMs: 32000, cycleRatio: 6, insightMultiplier: 5 },
  { id: 'cyan', color: 'cyan', label: 'Ciano', cycleBaseMs: 64000, cycleRatio: 7, insightMultiplier: 6 },
  { id: 'orange', color: 'red', label: 'Vermelho', cycleBaseMs: 128000, cycleRatio: 8, insightMultiplier: 7 },
  { id: 'lime', color: 'lime', label: 'Lima', cycleBaseMs: 256000, cycleRatio: 9, insightMultiplier: 8 },
  { id: 'fuchsia', color: 'fuchsia', label: 'Fuchsia', cycleBaseMs: 512000, cycleRatio: 10, insightMultiplier: 9 },
  { id: 'indigo', color: 'yellow', label: 'Amarelo', cycleBaseMs: 1024000, cycleRatio: 11, insightMultiplier: 10 },
]

const getCycleTimeMsForLine = (lineId, genId) => {
  const line = PRODUCTION_LINES.find(l => l.id === lineId)
  const base = line?.cycleBaseMs ?? 2000
  const ratio = line?.cycleRatio ?? 2
  return base * Math.pow(ratio, genId - 1)
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
    return {
      insights: new Decimal(data.insights ?? 0),
      lineData,
      activeProductionLine: PRODUCTION_LINES.some(l => l.id === data.activeProductionLine) ? data.activeProductionLine : 'rose',
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

// Barra de progresso suave: progresso calculado pelo tempo no rAF (60fps), sem depender do state do App
// Quando ciclo ≤ 1s: barra estática 100% com efeito de flow (sem animação de carregamento)
const FAST_CYCLE_MS = 1000

function SmoothBar({ cycleStartTime, cycleTimeMs, active, fillClassName, fillDarkClassName }) {
  const [progress, setProgress] = useState(0)
  const isFastCycle = cycleTimeMs > 0 && cycleTimeMs <= FAST_CYCLE_MS

  useEffect(() => {
    if (!active || !cycleTimeMs || cycleStartTime <= 0 || isFastCycle) {
      setProgress(0)
      return
    }
    let rafId
    const tick = () => {
      const elapsed = (Date.now() - cycleStartTime) % cycleTimeMs
      setProgress((elapsed / cycleTimeMs) * 100)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [cycleStartTime, cycleTimeMs, active, isFastCycle])

  const useFlowMode = active && cycleStartTime > 0 && isFastCycle
  const scale = useFlowMode ? 1 : (active && cycleStartTime > 0 ? Math.min(1, Math.max(0, progress / 100)) : 0)

  const fillDark = fillDarkClassName ?? fillClassName

  return (
    <>
      <div
        className="absolute inset-0 rounded-l-lg origin-left overflow-hidden flex flex-col"
        style={{ transform: `scaleX(${scale})` }}
      >
        <div className={cn('flex-1 min-h-0 rounded-none', fillClassName)} />
        <div className={cn('flex-1 min-h-0 rounded-none', fillDark)} />
      </div>
      {useFlowMode && (
        <div
          className="absolute inset-0 rounded-l-lg overflow-hidden pointer-events-none"
          aria-hidden
        >
          <div
            className="absolute inset-y-0 -left-[28px] w-[calc(200%_+_56px)] rounded-l-lg"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0px, rgba(255,255,255,0.25) 10px, transparent 10px, transparent 20px)',
              backgroundSize: '28px 28px',
              backgroundPosition: '0 0',
              animation: 'candy-tape-flow 1.2s linear infinite',
            }}
          />
        </div>
      )}
    </>
  )
}

function App() {
  // Game State (inicializa do localStorage se existir)
  const initial = getInitialSave()
  const [insights, setInsights] = useState(() => initial?.insights ?? new Decimal(0))
  const [lineData, setLineData] = useState(() => {
    const ld = {}
    for (const line of PRODUCTION_LINES) {
      ld[line.id] = initial?.lineData?.[line.id] ?? getFreshLineData()
    }
    return ld
  })
  const [tab, setTab] = useState("generators") // generators | upgrades
  const [activeProductionLine, setActiveProductionLine] = useState(() => initial?.activeProductionLine ?? 'rose')
  const [fps, setFps] = useState(0)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activeLine = lineData[activeProductionLine]
  const currency = activeLine?.currency ?? new Decimal(0)
  const generators = activeLine?.generators ?? INITIAL_GENERATORS
  const milestonesClaimed = activeLine?.milestonesClaimed ?? Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, 0]))
  const halfCycleRanks = activeLine?.halfCycleRanks ?? {}
  const doubleProductionRanks = activeLine?.doubleProductionRanks ?? {}

  const resetGame = () => {
    clearSaveCache()
    localStorage.removeItem(SAVE_KEY)
    setInsights(new Decimal(0))
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

  useEffect(() => {
    lineDataRef.current = lineData
  }, [lineData])

  // Persistir progresso no localStorage
  useEffect(() => {
    const lineDataSerial = {}
    for (const line of PRODUCTION_LINES) {
      const ld = lineData[line.id]
      if (ld) {
        lineDataSerial[line.id] = {
          currency: (ld.currency instanceof Decimal ? ld.currency : new Decimal(ld.currency ?? 0)).toString(),
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
      insights: insights.toString(),
      lineData: lineDataSerial,
      activeProductionLine,
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
  }, [insights, lineData, activeProductionLine])

  // FPS counter (frames por segundo)
  useEffect(() => {
    let frames = 0
    let lastTime = performance.now()
    let rafId
    const loop = () => {
      frames++
      const now = performance.now()
      if (now - lastTime >= 1000) {
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
      const n = d.toNumber()
      const intPart = Math.round(n)
      const sep = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      return sep
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

  // Formatação de tempo: sempre unidades inteiras + resto (1min 48s, 1a 9mês, 1déc 2a, etc.)
  const formatTime = (totalSeconds) => {
    const secs = typeof totalSeconds === 'number' ? totalSeconds : new Decimal(totalSeconds).toNumber()
    if (!Number.isFinite(secs) || secs < 0) return '0s'
    if (secs < 60) return (secs < 1 ? secs.toFixed(2) : Math.round(secs)) + 's'
    const m = Math.floor(secs / 60)
    const s = Math.round(secs % 60)
    if (m < 60) return s > 0 ? `${m}min ${s}s` : `${m}min`
    const h = Math.floor(m / 60)
    const min = m % 60
    if (h < 24) return min > 0 ? `${h}h ${min}min` : `${h}h`
    const d = Math.floor(h / 24)
    const hr = h % 24
    if (d < 7) return hr > 0 ? `${d}d ${hr}h` : `${d}d`
    if (d < 30) return `${Math.floor(d / 7)}sem ${d % 7}d`.replace(/ 0d$/, '')
    const SEC_PER_MONTH = 2592000
    const SEC_PER_YEAR = 31536000
    const SEC_PER_DECADE = 315360000
    if (secs < SEC_PER_YEAR) {
      const meses = Math.floor(secs / SEC_PER_MONTH)
      const dias = Math.floor((secs % SEC_PER_MONTH) / 86400)
      if (dias > 0) return `${meses}mês ${dias}d`
      return `${meses}mês`
    }
    if (secs < SEC_PER_DECADE) {
      const anos = Math.floor(secs / SEC_PER_YEAR)
      const meses = Math.floor((secs % SEC_PER_YEAR) / SEC_PER_MONTH)
      if (meses > 0) return `${anos}a ${meses}mês`
      return `${anos}a`
    }
    const decadas = Math.floor(secs / SEC_PER_DECADE)
    const anos = Math.floor((secs % SEC_PER_DECADE) / SEC_PER_YEAR)
    if (anos > 0) return `${decadas}déc ${anos}a`
    return `${decadas}déc`
  }

  // Cost Scaling: multiplicador por gerador (G1 +12%, G2 +18%, G3 +24%...)
  const getCost = (gen) => {
    const count = gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)
    if (gen.id === 1 && count.eq(0)) return new Decimal(0)
    const mult = getCostMultiplier(gen.id)
    return gen.cost.times(Decimal.pow(mult, count))
  }

  // Game Loop: lógica a cada 100ms; cada linha de produção ticka separadamente
  useEffect(() => {
    const INTERVAL_MS = 100
    const MIN_CYCLE_MS = 100
    const id = setInterval(() => {
      const now = Date.now()
      const current = lineDataRef.current
      if (!current || typeof current !== 'object') return
      const nextLineData = {}
      let hasUpdates = false
      for (const line of PRODUCTION_LINES) {
        const ld = current[line.id]
        if (!ld || !ld.generators) continue
        const up = { halfCycleRanks: ld.halfCycleRanks ?? {}, doubleProductionRanks: ld.doubleProductionRanks ?? {} }
        const getEffectiveCycleTime = (gen) => {
          const base = getCycleTimeMsForLine(line.id, gen.id)
          const rank = up.halfCycleRanks[gen.id] ?? 0
          if (rank === 0) return base
          return Math.max(MIN_CYCLE_MS, base / Math.pow(2, rank))
        }
        const getProductionMultiplier = (genId) => Math.pow(2, up.doubleProductionRanks[genId] ?? 0)
        const gens = ld.generators
        const withProgress = gens.map(gen => {
          const count = gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)
          if (!count.gt(0)) return { ...gen, _cycles: 0 }
          const start = gen.cycleStartTime || now
          const elapsed = now - start
          const cycleTime = getEffectiveCycleTime(gen)
          const cycles = Math.floor(elapsed / cycleTime)
          const newCycleStartTime = start + cycles * cycleTime
          return { ...gen, cycleStartTime: newCycleStartTime, _cycles: cycles }
        })
        const gen1 = withProgress[0]
        const count1 = gen1?.count instanceof Decimal ? gen1.count : new Decimal(gen1?.count ?? 0)
        const cycles1 = gen1?._cycles ?? 0
        const mult1 = getProductionMultiplier(1)
        const currencyFromGen1 = new Decimal(cycles1).times(count1).times(mult1)
        const ldCurrency = ld.currency instanceof Decimal ? ld.currency : new Decimal(ld.currency ?? 0)
        const newCurrency = ldCurrency.plus(currencyFromGen1)
        const nextGenerators = withProgress.map((gen, i) => {
          let added = new Decimal(0)
          if (i < withProgress.length - 1) {
            const upper = withProgress[i + 1]
            const upperCount = upper.count instanceof Decimal ? upper.count : new Decimal(upper.count ?? 0)
            added = new Decimal(upper._cycles ?? 0).times(upperCount).times(getProductionMultiplier(upper.id))
          }
          const { _cycles, ...rest } = gen
          const restCount = rest.count instanceof Decimal ? rest.count : new Decimal(rest.count ?? 0)
          return { ...rest, count: restCount.plus(added) }
        })
        const active = nextGenerators.some(g => {
          const c = g.count instanceof Decimal ? g.count : new Decimal(g.count ?? 0)
          return c.gt(0)
        })
        if (active || currencyFromGen1.gt(0)) hasUpdates = true
        nextLineData[line.id] = {
          ...ld,
          currency: newCurrency,
          generators: nextGenerators,
        }
      }
      if (hasUpdates && Object.keys(nextLineData).length > 0) {
        setLineData(prev => {
          const next = { ...prev }
          for (const k of Object.keys(nextLineData)) {
            next[k] = nextLineData[k]
          }
          return next
        })
      }
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const MIN_CYCLE_MS = 100
  // Para comprar G1 da linha N: precisa ter G(N+1) da linha anterior automatizado (G(N+2) count > 0)
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

  const buyGenerator = (id) => {
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

    const cost = getCost(gen)
    const curr = ld.currency instanceof Decimal ? ld.currency : new Decimal(ld.currency ?? 0)
    if (!curr.gte(cost)) return

    const newGenerators = [...gens]
    const prevCount = gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)
    newGenerators[genIndex] = {
      ...gen,
      count: prevCount.plus(1),
      cycleStartTime: prevCount.eq(0) ? Date.now() : (gen.cycleStartTime || Date.now())
    }
    setLineData(prev => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        currency: curr.minus(cost),
        generators: newGenerators,
      },
    }))
  }

  const getEffectiveCycleTime = (gen) => {
    const base = getCycleTimeMsForLine(activeProductionLine, gen.id)
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
          <ScrollArea className="flex-1 min-w-0 min-h-0 pb-20">
          <div className="space-y-6 w-full p-2.5" style={{ minWidth: 0, boxSizing: 'border-box' }}>
            {tab === 'generators' && (
            <div className="flex flex-col gap-4 w-full min-w-0 overflow-visible">
                {/* Card Insights + FPS — acima das tabs */}
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
                  <div className="relative z-10 flex items-center gap-2">
                    <Sparkle className="w-4 h-4 shrink-0 text-violet-300" />
                    <span>{format(insights)}</span>
                    <span className="text-zinc-500 text-xs">Insights</span>
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
                {/* Cards de seleção de linha de produção + recurso da linha */}
                <div className="flex flex-wrap gap-2">
                  {PRODUCTION_LINES.map((line) => {
                    const ld = lineData[line.id]
                    const curr = ld?.currency instanceof Decimal ? ld.currency : new Decimal(ld?.currency ?? 0)
                    const lineColors = BAR_COLORS[line.color] ?? BAR_COLORS.rose
                    const isActive = activeProductionLine === line.id
                    return (
                      <button
                        key={line.id}
                        type="button"
                        onClick={() => setActiveProductionLine(line.id)}
                        className={cn(
                          "relative h-8 min-w-[9rem] flex-1 max-w-[12rem] rounded-lg flex items-center justify-center gap-2 overflow-hidden border transition-all shrink-0 px-3",
                          lineColors.border,
                          isActive
                            ? "ring-2 ring-offset-2 ring-offset-background ring-white/50 shadow-md"
                            : "opacity-75 hover:opacity-100"
                        )}
                      >
                        <div className="absolute inset-0 flex flex-col pointer-events-none">
                          <div className={cn("flex-1 min-h-0", lineColors.track)} />
                          <div className={cn("flex-1 min-h-0", lineColors.trackDark ?? lineColors.track)} />
                        </div>
                        <Coins className="relative z-10 w-3.5 h-3.5 shrink-0 text-amber-300/90" />
                        <span className="relative z-10 text-xs font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
                          {line.label}
                        </span>
                        <span className="relative z-10 text-xs font-medium tabular-nums text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)] truncate">
                          {format(curr)}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex flex-col gap-3 w-full min-w-0 overflow-visible">
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
                  const canAfford = currency.gte(currentCost)
                  const canBuyG1 = gen.id === 1 ? canBuyLineG1(activeProductionLine) : true
                  const lineIdx = PRODUCTION_LINES.findIndex(l => l.id === activeProductionLine)
                  const g1RequirementText = gen.id === 1 && lineIdx > 0
                    ? `Requisito: automatize o Gerador ${lineIdx + 1} da linha ${PRODUCTION_LINES[lineIdx - 1].label}`
                    : null
                  const lineColor = PRODUCTION_LINES.find(l => l.id === activeProductionLine)?.color ?? 'rose'
                  const colors = BAR_COLORS[lineColor] ?? BAR_COLORS.emerald
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
                        /* Card de desbloqueio: toda a linha é um único card clicável */
                        <button
                          type="button"
                          disabled={!canAfford || !canBuyG1}
                          onClick={() => (canAfford && canBuyG1) && buyGenerator(gen.id)}
                          className={cn(
                            "relative w-full h-8 rounded-lg flex items-center justify-center gap-3 px-4 transition-opacity overflow-hidden",
                            colors.border,
                            "border",
                            (!canAfford || !canBuyG1) && "opacity-70 cursor-not-allowed"
                          )}
                        >
                          <div className="absolute inset-0 flex flex-col pointer-events-none">
                            <div className={cn("flex-1 min-h-0", colors.track)} />
                            <div className={cn("flex-1 min-h-0", colors.trackDark ?? colors.track)} />
                          </div>
                          <span className="relative z-10 text-xs font-semibold text-white shrink-0 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
                            {gen.name}
                          </span>
                          <span className="relative z-10 w-px h-4 bg-white/30 shrink-0" aria-hidden />
                          <span className="relative z-10 text-xs text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
                            {gen.id === 1 && !canBuyG1 && g1RequirementText ? g1RequirementText : 'Desbloqueie para começar a produzir'}
                          </span>
                          <span className="relative z-10 w-px h-4 bg-white/30 shrink-0" aria-hidden />
                          <span className="relative z-10 text-xs text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
                            Custo para desbloquear: <span className={canAfford && canBuyG1 ? "text-amber-400 font-medium" : ""}>{formatCost(currentCost)}</span>
                          </span>
                        </button>
                      ) : (
                        <>
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
                                {gen.name}
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
                            />
                            <div
                              className="absolute inset-0 flex items-center justify-between px-3 text-white select-none pointer-events-none z-10 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]"
                            >
                              <span className="text-xs font-medium text-white/95 tabular-nums w-[4.5rem] shrink-0 text-left">
                                {getEffectiveCycleTime(gen) > 1000 ? formatTime(getEffectiveCycleTime(gen) / 1000) : ''}
                              </span>
                              <span className="text-xs font-medium text-white/95 tabular-nums shrink-0 text-center">{format(gen.count)} un.</span>
                              <span className="text-xs font-medium text-white/95 truncate w-[7.5rem] shrink-0 text-right">
                                {(() => {
                                  const mult = getProductionMultiplierDisplay(gen.id)
                                  const prodPerCycle = count.times(mult)
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
                            <>
                              <Button
                                size="default"
                                variant={canAfford ? "default" : "outline"}
                                disabled={!canAfford}
                                onClick={() => buyGenerator(gen.id)}
                                className={cn(
                                  "shrink-0 w-[100px] h-8",
                                  !canAfford && "border-zinc-500/90 bg-zinc-600/70 text-zinc-200 hover:bg-zinc-600/70 hover:text-zinc-200 disabled:opacity-95 disabled:cursor-not-allowed"
                                )}
                              >
                                Comprar
                              </Button>
                              <div
                                className={cn(
                                  "relative h-8 w-[11rem] shrink-0 rounded-lg flex items-center justify-between gap-2 px-3 overflow-hidden border",
                                  colors.border,
                                  "text-white text-xs font-medium tabular-nums [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)] truncate"
                                )}
                                title={formatCost(currentCost)}
                              >
                                <div className="absolute inset-0 flex flex-col pointer-events-none">
                                  <div className={cn("flex-1 min-h-0", colors.track)} />
                                  <div className={cn("flex-1 min-h-0", colors.trackDark ?? colors.track)} />
                                </div>
                                <Coins className="relative z-10 w-4 h-4 shrink-0 text-amber-300/90" />
                                <span className="relative z-10 truncate text-right">{formatCost(currentCost)}</span>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
                </div>
            </div>
            )}

            {tab === 'upgrades' && (
              <div className="flex flex-col gap-5 w-full">
                <p className="text-sm text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
                  Gaste Insights para melhorar um gerador. Cada melhoria aparece em um card abaixo.
                </p>
                {/* Cards de seleção de linha de produção (mesmo esquema dos geradores) */}
                <div className="flex flex-wrap gap-2">
                  {PRODUCTION_LINES.map((line) => {
                    const ld = lineData[line.id]
                    const curr = ld?.currency instanceof Decimal ? ld.currency : new Decimal(ld?.currency ?? 0)
                    const lineColors = BAR_COLORS[line.color] ?? BAR_COLORS.rose
                    const isActive = activeProductionLine === line.id
                    return (
                      <button
                        key={line.id}
                        type="button"
                        onClick={() => setActiveProductionLine(line.id)}
                        className={cn(
                          "relative h-8 min-w-[9rem] flex-1 max-w-[12rem] rounded-lg flex items-center justify-center gap-2 overflow-hidden border transition-all shrink-0 px-3",
                          lineColors.border,
                          isActive
                            ? "ring-2 ring-offset-2 ring-offset-background ring-white/50 shadow-md"
                            : "opacity-75 hover:opacity-100"
                        )}
                      >
                        <div className="absolute inset-0 flex flex-col pointer-events-none">
                          <div className={cn("flex-1 min-h-0", lineColors.track)} />
                          <div className={cn("flex-1 min-h-0", lineColors.trackDark ?? lineColors.track)} />
                        </div>
                        <Coins className="relative z-10 w-3.5 h-3.5 shrink-0 text-amber-300/90" />
                        <span className="relative z-10 text-xs font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">
                          {line.label}
                        </span>
                        <span className="relative z-10 text-xs font-medium tabular-nums text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)] truncate">
                          {format(curr)}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex flex-col gap-4">
                  {generators
                    .filter((gen) => (gen.count instanceof Decimal ? gen.count : new Decimal(gen.count ?? 0)).gt(0))
                    .map((gen) => {
                      const lineColor = PRODUCTION_LINES.find(l => l.id === activeProductionLine)?.color ?? 'rose'
                      const colors = BAR_COLORS[lineColor] ?? BAR_COLORS.rose
                      const halfRank = halfCycleRanks[gen.id] ?? 0
                      const prodRank = doubleProductionRanks[gen.id] ?? 0
                      const maxHalfRank = getMaxHalfCycleRank(gen)
                      const halfAtMax = halfRank >= maxHalfRank
                      const halfCost = getUpgradeCost(gen.id, halfRank + 1)
                      const prodCost = getUpgradeCost(gen.id, prodRank + 1)
                      const insightsNum = insights instanceof Decimal ? insights.toNumber() : insights

                      const toRoman = (n) => ['I','II','III','IV','V','VI','VII','VIII','IX','X'][n - 1] ?? String(n)

                      const UpgradeCard = ({ icon: Icon, title, rankText, desc, effect, cost, atMax, onBuy, canBuy, cardClassName }) => (
                        <div className={cn("relative flex flex-col gap-3 overflow-hidden p-4 min-h-0", cardClassName)}>
                          <div className="absolute inset-0 flex flex-col pointer-events-none">
                            <div className={cn("flex-1 min-h-0", colors.track)} />
                            <div className={cn("flex-1 min-h-0", colors.trackDark ?? colors.track)} />
                          </div>
                          <div className="relative z-10 flex items-center gap-2">
                            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", colors.track, "bg-white/10")}>
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
                                <Sparkle className="h-3.5 w-3.5" />
                                {format(cost)} Insight{cost !== 1 ? 's' : ''}
                              </div>
                              <button
                                type="button"
                                disabled={!canBuy}
                                onClick={() => canBuy && onBuy()}
                                className={cn(
                                  "shrink-0 h-8 px-4 rounded-lg text-xs font-semibold transition-opacity [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]",
                                  canBuy ? cn(colors.fill, "text-white hover:opacity-90") : "bg-white/10 text-white/50 cursor-not-allowed"
                                )}
                              >
                                Comprar
                              </button>
                            </div>
                          )}
                        </div>
                      )

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
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                              <Zap className="h-4 w-4" strokeWidth={2.5} />
                            </div>
                            <span className="font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.8)]">{gen.name}</span>
                          </div>

                          <div className="relative z-10 grid gap-0 sm:grid-cols-2 p-0">
                            <UpgradeCard
                              cardClassName="border-b sm:border-b-0 sm:border-r border-white/20"
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
              </div>
            )}
          </div>
        </ScrollArea>
        </div>

        {/* Bottom: Abas Geradores | Melhorias | Configurações */}
        <div className="shrink-0 fixed bottom-0 left-0 right-0 flex justify-center gap-2 p-4 pt-2 bg-background/95 border-t border-border z-30">
          <Button
            variant={tab === 'generators' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('generators')}
            className="gap-2 h-9"
          >
            <Zap className="w-4 h-4" />
            Geradores
          </Button>
          <Button
            variant={tab === 'upgrades' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('upgrades')}
            className="gap-2 h-9"
          >
            <Settings className="w-4 h-4" />
            Melhorias
          </Button>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(v => !v)}
              className="h-9 w-9 p-0"
              title="Configurações"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
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
