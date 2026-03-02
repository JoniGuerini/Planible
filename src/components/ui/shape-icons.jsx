import * as React from 'react'

const LUCIDE_SVG_PROPS = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function polygonPoints(n, cx = 12, cy = 12, r = 10) {
  const points = []
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
  }
  return points.join(' ')
}

export function HeptagonIcon(props) {
  return (
    <svg {...LUCIDE_SVG_PROPS} width={24} height={24} {...props}>
      <polygon points={polygonPoints(7)} />
    </svg>
  )
}

export function NonagonIcon(props) {
  return (
    <svg {...LUCIDE_SVG_PROPS} width={24} height={24} {...props}>
      <polygon points={polygonPoints(9)} />
    </svg>
  )
}

export function DecagonIcon(props) {
  return (
    <svg {...LUCIDE_SVG_PROPS} width={24} height={24} {...props}>
      <polygon points={polygonPoints(10)} />
    </svg>
  )
}
