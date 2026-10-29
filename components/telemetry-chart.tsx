import { cn } from '@/lib/utils'

const strokeVar: Record<number, string> = {
  1: 'var(--chart-1)',
  2: 'var(--chart-2)',
  3: 'var(--chart-3)',
  4: 'var(--chart-4)',
  5: 'var(--chart-5)',
}

// Lightweight technical area chart rendered as inline SVG (no client runtime).
export function TelemetryChart({
  data,
  height = 120,
  color = 1,
  className,
  unit,
}: {
  data: number[]
  height?: number
  color?: 1 | 2 | 3 | 4 | 5
  className?: string
  unit?: string
}) {
  const width = 640
  const pad = 6
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = (width - pad * 2) / (data.length - 1)

  const points = data.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (height - pad * 2) * (1 - (v - min) / range)
    return [x, y] as const
  })

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${height - pad} L${points[0][0].toFixed(1)},${height - pad} Z`
  const stroke = strokeVar[color]
  const gradId = `grad-${color}`

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-auto w-full"
        style={{ height }}
        role="img"
        aria-label={`Telemetry chart${unit ? ` in ${unit}` : ''}`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={width - pad}
            y1={pad + (height - pad * 2) * g}
            y2={pad + (height - pad * 2) * g}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2.5" fill={stroke} />
      </svg>
    </div>
  )
}
