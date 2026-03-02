import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const SCROLLBAR_WIDTH = 6

/**
 * Área de scroll com barra em overlay — NUNCA empurra o conteúdo.
 * A barra é renderizada via Portal + position:fixed, completamente fora do layout.
 */
const OverlayScrollArea = React.forwardRef(({ className, children, ...props }, ref) => {
  const wrapperRef = React.useRef(null)
  const viewportRef = React.useRef(null)
  const thumbRef = React.useRef(null)
  const [thumbHeight, setThumbHeight] = React.useState(0)
  const [thumbTop, setThumbTop] = React.useState(0)
  const [isVisible, setIsVisible] = React.useState(false)
  const [trackRect, setTrackRect] = React.useState(null)
  const rafRef = React.useRef(null)

  const updateThumb = React.useCallback(() => {
    const vp = viewportRef.current
    const wr = wrapperRef.current
    if (!vp || !wr) return

    const { scrollHeight, clientHeight, scrollTop } = vp
    if (scrollHeight <= clientHeight) {
      setIsVisible(false)
      return
    }
    setIsVisible(true)

    const rect = wr.getBoundingClientRect()
    setTrackRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })

    const trackHeight = rect.height
    const ratio = clientHeight / scrollHeight
    const thumbH = Math.max(20, ratio * trackHeight)
    const maxThumbTop = trackHeight - thumbH
    const scrollRatio = scrollTop / (scrollHeight - clientHeight)
    const top = scrollRatio * maxThumbTop

    setThumbHeight(thumbH)
    setThumbTop(top)
  }, [])

  React.useEffect(() => {
    const vp = viewportRef.current
    const wr = wrapperRef.current
    if (!vp || !wr) return

    const scheduleUpdate = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateThumb)
    }

    const observer = new ResizeObserver(scheduleUpdate)
    observer.observe(vp)
    observer.observe(wr)

    vp.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    updateThumb()

    return () => {
      observer.disconnect()
      vp.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('scroll', scheduleUpdate)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [updateThumb])

  React.useLayoutEffect(() => {
    if (isVisible) updateThumb()
  }, [isVisible, updateThumb])

  const handleTrackWheel = React.useCallback((e) => {
    const vp = viewportRef.current
    if (!vp) return
    e.preventDefault()
    vp.scrollTop += e.deltaY
  }, [])

  const handleThumbMouseDown = React.useCallback((e) => {
    e.preventDefault()
    const vp = viewportRef.current
    if (!vp) return
    const startY = e.clientY
    const startScrollTop = vp.scrollTop
    const { scrollHeight, clientHeight } = vp
    const maxScroll = scrollHeight - clientHeight
    const thumbH = thumbRef.current?.offsetHeight ?? 20
    const trackH = trackRect?.height ?? clientHeight
    const maxThumbTop = Math.max(1, trackH - thumbH)
    const scrollPerPx = maxScroll / maxThumbTop

    const onMove = (e2) => {
      const dy = e2.clientY - startY
      vp.scrollTop = Math.max(0, Math.min(maxScroll, startScrollTop + dy * scrollPerPx))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [trackRect?.height])

  const scrollbarPortal = isVisible && trackRect && typeof document !== 'undefined' && createPortal(
    <div
      className="planible-scroll-track planible-scroll-track-portal"
      style={{
        position: 'fixed',
        top: trackRect.top,
        left: trackRect.left + trackRect.width - SCROLLBAR_WIDTH - 4,
        width: SCROLLBAR_WIDTH,
        height: trackRect.height,
        padding: '4px 0',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
        zIndex: 9999,
      }}
      onWheel={handleTrackWheel}
    >
      <div
        ref={thumbRef}
        role="scrollbar"
        aria-orientation="vertical"
        className="planible-scroll-thumb w-full min-h-[20px] rounded-full cursor-grab active:cursor-grabbing touch-none"
        style={{
          height: thumbHeight,
          transform: `translateY(${thumbTop}px)`,
        }}
        onMouseDown={handleThumbMouseDown}
      />
    </div>,
    document.body
  )

  return (
    <div
      ref={(node) => {
        wrapperRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <div
        ref={viewportRef}
        className="planible-scroll-viewport h-full w-full min-h-0 overflow-y-auto overflow-x-hidden"
        tabIndex={0}
      >
        {children}
      </div>
      {scrollbarPortal}
    </div>
  )
})
OverlayScrollArea.displayName = 'OverlayScrollArea'

export { OverlayScrollArea }
