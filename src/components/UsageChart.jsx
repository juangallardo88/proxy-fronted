import { fmt } from '../utils.js'

const W = 320
const H = 170
const PAD_TOP = 22
const PAD_BOTTOM = 26
const GAP = 12

export default function UsageChart({ history }) {
  if (!history) return <section className="card skeleton tall" aria-busy="true" />

  const days = history.days || []
  const max = Math.max(...days.map((d) => d.tokens), 1)
  const barW = (W - GAP * (days.length + 1)) / Math.max(days.length, 1)
  const chartH = H - PAD_TOP - PAD_BOTTOM
  const empty = days.every((d) => d.tokens === 0)

  return (
    <section className="card">
      <header className="card-head">
        <h2>Uso de los últimos 7 días</h2>
      </header>

      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Gráfica de barras de tokens por día">
        <line x1={GAP / 2} x2={W - GAP / 2} y1={H - PAD_BOTTOM} y2={H - PAD_BOTTOM} className="chart-axis" />
        {days.map((d, i) => {
          const h = d.tokens === 0 ? 2 : Math.max(4, (d.tokens / max) * chartH)
          const x = GAP + i * (barW + GAP)
          const y = H - PAD_BOTTOM - h
          const isToday = i === days.length - 1
          return (
            <g key={d.date}>
              <title>{`${d.date}: ${fmt(d.tokens)} tokens en ${d.requests} requests`}</title>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={4}
                className={`chart-bar ${isToday ? 'today' : ''} ${d.tokens === 0 ? 'zero' : ''}`}
              />
              {d.tokens > 0 && (
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="chart-value">
                  {d.tokens >= 1000 ? `${(d.tokens / 1000).toFixed(1)}k` : d.tokens}
                </text>
              )}
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" className={`chart-label ${isToday ? 'today' : ''}`}>
                {isToday ? 'hoy' : d.dayLabel.replace('.', '')}
              </text>
            </g>
          )
        })}
      </svg>

      <p className="muted small">
        {empty
          ? 'Aún no hay consumo registrado.'
          : `Total: ${fmt(history.totalTokens)} tokens en ${history.totalRequests} requests`}
      </p>
    </section>
  )
}
