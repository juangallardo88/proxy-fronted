// Muestra el recorrido de una request por la cadena de proxies.
// state por paso: 'pass' | 'fail' | 'idle'

export function ProxyDiagram({ status }) {
  const rpm = !status ? '…' : status.requestsPerMinuteLimit < 0 ? 'sin límite' : `${status.requestsPerMinuteLimit} por minuto`
  const tokens = !status
    ? '…'
    : status.monthlyTokenLimit < 0
      ? 'sin límite'
      : `${new Intl.NumberFormat('es-CO').format(status.monthlyTokenLimit)} al mes`
  const steps = [
    { name: 'Tu prompt', detail: 'Enviado desde aquí' },
    { name: 'Rate limit', detail: rpm, code: '429' },
    { name: 'Cuota', detail: tokens, code: '402' },
    { name: 'Servicio IA', detail: 'Genera la respuesta' },
  ]
  return (
    <ol className="diagram" aria-label="Recorrido de cada mensaje">
      {steps.map((s, i) => (
        <li key={s.name} className="diagram-step">
          <span className="diagram-node">{i + 1}</span>
          <span className="diagram-name">{s.name}</span>
          <span className="diagram-detail">{s.detail}</span>
          {s.code && <span className="diagram-code">si se bloquea: {s.code}</span>}
        </li>
      ))}
    </ol>
  )
}

const STEP_NAMES = { rate: 'Rate limit', quota: 'Cuota', ai: 'IA' }

export function ProxyTrace({ trace }) {
  return (
    <span className="trace" aria-label="Recorrido por los proxies">
      {['rate', 'quota', 'ai'].map((k) => (
        <span key={k} className={`trace-step trace-${trace[k] || 'idle'}`}>
          <span className="trace-mark" aria-hidden="true">
            {trace[k] === 'pass' ? '✓' : trace[k] === 'fail' ? '✕' : ''}
          </span>
          {STEP_NAMES[k]}
        </span>
      ))}
    </span>
  )
}
