import { fmt } from '../utils.js'

const W = 320
const H = 150
const TOP = 20
const BOTTOM = 24
const GAP = 10

export default function UsageChart({ history }) {
  if (!history) return <section className="panel skeleton" aria-busy="true" />

  const days = history.days || []
  const max = Math.max(...days.map((d) => d.tokens), 1)
  const barW = (W - GAP * (days.length - 1)) / Math.max(days.length, 1)
  const chartH = H - TOP - BOTTOM
  const empty = days.every((d) => d.tokens === 0)

  return (
    <section className="panel" aria-labelledby="chart-title">
      <div className="chart-head">
        <h2 id="chart-title" className="panel-title">Últimos 7 días</h2>
        {!empty && <span className="chart-total">{fmt(history.totalTokens)} tokens</span>}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Tokens consumidos por día en los últimos 7 días">
        <line x1="0" x2={W} y1={TOP} y2={TOP} className="chart-grid" />
        <line x1="0" x2={W} y1={TOP + chartH / 2} y2={TOP + chartH / 2} className="chart-grid" />
        <line x1="0" x2={W} y1={H - BOTTOM} y2={H - BOTTOM} className="chart-axis" />
        {days.map((d, i) => {
          const h = d.tokens === 0 ? 0 : Math.max(3, (d.tokens / max) * chartH)
          const x = i * (barW + GAP)
          const y = H - BOTTOM - h
          const isToday = i === days.length - 1
          return (
            <g key={d.date} className="chart-col">
              <title>{`${d.date}: ${fmt(d.tokens)} tokens en ${d.requests} requests`}</title>
              <rect x={x} y={TOP} width={barW} height={chartH} className="chart-hit" />
              {h > 0 && <rect x={x} y={y} width={barW} height={h} rx="3" className={`chart-bar ${isToday ? 'today' : ''}`} />}
              {d.tokens > 0 && (
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="chart-value">
                  {d.tokens >= 1000 ? `${(d.tokens / 1000).toFixed(1).replace('.0', '')}k` : d.tokens}
                </text>
              )}
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" className={`chart-label ${isToday ? 'today' : ''}`}>
                {isToday ? 'Hoy' : d.dayLabel.replace('.', '')}
              </text>
            </g>
          )
        })}
      </svg>

      {empty && <p className="muted small">Todavía no hay consumo. Envía un mensaje y aparecerá aquí.</p>}
      {!empty && (
        <p className="muted small">{history.totalRequests} requests en la semana</p>
      )}
    </section>
  )
}
