import { fmt, formatDate } from '../utils.js'

export default function QuotaCard({ status }) {
  if (!status) return <section className="card skeleton" aria-busy="true" />

  const unlimited = status.monthlyTokenLimit < 0
  const pct = unlimited ? 0 : Math.min(100, (status.tokensUsed / status.monthlyTokenLimit) * 100)
  const level = pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : 'ok'

  return (
    <section className="card">
      <header className="card-head">
        <h2>Cuota mensual de tokens</h2>
        {!unlimited && <span className={`pct pct-${level}`}>{pct.toFixed(pct < 10 ? 1 : 0)}%</span>}
      </header>

      {unlimited ? (
        <div className="unlimited">
          <strong>Ilimitado</strong>
          <span>{fmt(status.tokensUsed)} tokens usados este mes</span>
        </div>
      ) : (
        <>
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={status.monthlyTokenLimit}
            aria-valuenow={status.tokensUsed}
            aria-label="Tokens usados"
          >
            <div className={`progress-fill fill-${level}`} style={{ width: `${pct}%` }} />
          </div>
          <dl className="stats">
            <div>
              <dt>Usados</dt>
              <dd>{fmt(status.tokensUsed)}</dd>
            </div>
            <div>
              <dt>Disponibles</dt>
              <dd>{fmt(status.tokensRemaining)}</dd>
            </div>
            <div>
              <dt>Límite</dt>
              <dd>{fmt(status.monthlyTokenLimit)}</dd>
            </div>
          </dl>
        </>
      )}
      <p className="muted small">Se reinicia el {formatDate(status.resetDate)}</p>
    </section>
  )
}
