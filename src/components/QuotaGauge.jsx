import { fmt, formatDate } from '../utils.js'

const SIZE = 240
const C = SIZE / 2
const R = 92
const START = 150 // grados, abajo a la izquierda
const SWEEP = 240

function point(angle, radius = R) {
  const a = (angle * Math.PI) / 180
  return [C + radius * Math.cos(a), C + radius * Math.sin(a)]
}

const [sx, sy] = point(START)
const [ex, ey] = point(START + SWEEP)
const ARC = `M ${sx} ${sy} A ${R} ${R} 0 1 1 ${ex} ${ey}`
const TICKS = [0, 0.25, 0.5, 0.75, 1]

export default function QuotaGauge({ status }) {
  if (!status) return <section className="panel meter skeleton" aria-busy="true" />

  const unlimited = status.monthlyTokenLimit < 0
  const frac = unlimited ? 1 : Math.min(1, status.tokensUsed / status.monthlyTokenLimit)
  const level = unlimited ? 'unlimited' : frac >= 1 ? 'empty' : frac >= 0.9 ? 'danger' : frac >= 0.7 ? 'warn' : 'ok'

  return (
    <section className={`panel meter meter-${level}`} aria-labelledby="meter-title">
      <h2 id="meter-title" className="panel-title">Cuota del mes</h2>

      <div className="gauge">
        <svg viewBox={`0 0 ${SIZE} ${SIZE * 0.86}`} role="img" aria-label={
          unlimited ? 'Tokens ilimitados' : `${fmt(status.tokensUsed)} de ${fmt(status.monthlyTokenLimit)} tokens usados`
        }>
          <path d={ARC} className="gauge-track" pathLength="100" />
          <path
            d={ARC}
            className="gauge-fill"
            pathLength="100"
            strokeDasharray={`${frac * 100} 100`}
            style={{ opacity: frac === 0 ? 0 : 1 }}
          />
          {TICKS.map((t) => {
            const angle = START + SWEEP * t
            const [x1, y1] = point(angle, R + 14)
            const [x2, y2] = point(angle, R + 20)
            return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} className="gauge-tick" />
          })}
        </svg>

        <div className="gauge-center">
          {unlimited ? (
            <>
              <span className="gauge-number">∞</span>
              <span className="gauge-label">tokens sin límite</span>
            </>
          ) : (
            <>
              <span className="gauge-number">{fmt(status.tokensRemaining)}</span>
              <span className="gauge-label">tokens disponibles</span>
            </>
          )}
        </div>
      </div>

      <div className="meter-foot">
        <p>
          {unlimited ? (
            <>Usaste <strong>{fmt(status.tokensUsed)}</strong> tokens este mes</>
          ) : (
            <>
              Usaste <strong>{fmt(status.tokensUsed)}</strong> de {fmt(status.monthlyTokenLimit)}
              <span className={`meter-pct pct-${level}`}>{Math.round(frac * 100)}%</span>
            </>
          )}
        </p>
        <p className="muted">Se reinicia el {formatDate(status.resetDate)}</p>
      </div>
    </section>
  )
}
