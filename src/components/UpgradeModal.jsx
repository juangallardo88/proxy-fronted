import { useEffect, useState } from 'react'
import PlanBadge from './PlanBadge.jsx'
import { PLANS, fmt } from '../utils.js'

const ORDER = ['FREE', 'PRO', 'ENTERPRISE']
const TEST_CARD = '4242 4242 4242 4242'

export default function UpgradeModal({ open, reason, currentPlan, onClose, onUpgrade }) {
  const [step, setStep] = useState('plans') // plans | payment | processing | done
  const [target, setTarget] = useState('PRO')
  const [form, setForm] = useState({ name: '', card: TEST_CARD, exp: '12/30', cvc: '123' })
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)

  const options = ORDER.slice(ORDER.indexOf(currentPlan || 'FREE') + 1)

  useEffect(() => {
    if (open) {
      setStep('plans')
      setTarget(options[0] || 'PRO')
      setError('')
      setReceipt(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && step !== 'processing' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, step, onClose])

  if (!open) return null

  const digits = form.card.replace(/\D/g, '')
  const validCard = digits.length === 16
  const validExp = /^(0[1-9]|1[0-2])\/\d{2}$/.test(form.exp)
  const validCvc = /^\d{3,4}$/.test(form.cvc)
  const validName = form.name.trim().length >= 3
  const canPay = validCard && validExp && validCvc && validName

  function update(field, value) {
    if (field === 'card') {
      value = value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
    }
    if (field === 'exp') {
      value = value.replace(/\D/g, '').slice(0, 4)
      if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2)
    }
    if (field === 'cvc') value = value.replace(/\D/g, '').slice(0, 4)
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function pay(e) {
    e.preventDefault()
    if (!canPay) return
    setError('')
    setStep('processing')
    // Simula el tiempo de la pasarela de pago
    await new Promise((r) => setTimeout(r, 1500))
    try {
      const res = await onUpgrade(target, digits.slice(-4))
      setReceipt(res)
      setStep('done')
    } catch (err) {
      setError(err.message || 'No se pudo completar el pago')
      setStep('payment')
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && step !== 'processing' && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
        {step !== 'processing' && (
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        )}

        {step === 'plans' && (
          <>
            <h2 id="upgrade-title">{reason === 'quota' ? 'Agotaste tu cuota mensual' : 'Mejora tu plan'}</h2>
            <p className="muted">
              {reason === 'quota'
                ? 'Tu plan actual no tiene más tokens este mes. Mejora tu plan para seguir usando el servicio.'
                : 'Elige un plan con más requests por minuto y más tokens al mes.'}
            </p>
            {options.length === 0 ? (
              <p>Ya tienes el plan más alto.</p>
            ) : (
              <div className="plans">
                {options.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`plan ${target === p ? 'plan-selected' : ''}`}
                    onClick={() => setTarget(p)}
                    aria-pressed={target === p}
                  >
                    <PlanBadge plan={p} />
                    <div className="plan-price">
                      US$ {PLANS[p].price}
                      <span>/mes</span>
                    </div>
                    <ul>
                      <li>{PLANS[p].rpm ? `${PLANS[p].rpm} requests por minuto` : 'Requests ilimitadas'}</li>
                      <li>{PLANS[p].tokens ? `${fmt(PLANS[p].tokens)} tokens al mes` : 'Tokens ilimitados'}</li>
                    </ul>
                  </button>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>
                Ahora no
              </button>
              {options.length > 0 && (
                <button className="btn btn-primary" onClick={() => setStep('payment')}>
                  Continuar con {PLANS[target].name}
                </button>
              )}
            </div>
          </>
        )}

        {(step === 'payment' || step === 'processing') && (
          <form onSubmit={pay}>
            <h2 id="upgrade-title">Pago simulado</h2>
            <p className="sim-note">
              Simulación: no se hace ningún cobro. Usa la tarjeta de prueba, no ingreses datos reales.
            </p>
            <div className="summary">
              <span>
                Plan <PlanBadge plan={target} size="sm" />
              </span>
              <strong>US$ {PLANS[target].price}/mes</strong>
            </div>

            <label className="field">
              <span>Nombre en la tarjeta</span>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Nombre Apellido"
                autoFocus
                disabled={step === 'processing'}
              />
            </label>
            <label className="field">
              <span>Número de tarjeta</span>
              <input
                value={form.card}
                onChange={(e) => update('card', e.target.value)}
                inputMode="numeric"
                disabled={step === 'processing'}
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Vence (MM/AA)</span>
                <input value={form.exp} onChange={(e) => update('exp', e.target.value)} disabled={step === 'processing'} />
              </label>
              <label className="field">
                <span>CVC</span>
                <input
                  value={form.cvc}
                  onChange={(e) => update('cvc', e.target.value)}
                  inputMode="numeric"
                  disabled={step === 'processing'}
                />
              </label>
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep('plans')} disabled={step === 'processing'}>
                Atrás
              </button>
              <button type="submit" className="btn btn-primary" disabled={!canPay || step === 'processing'}>
                {step === 'processing' ? (
                  <>
                    <span className="spinner" aria-hidden="true" /> Procesando pago…
                  </>
                ) : (
                  `Pagar US$ ${PLANS[target].price}`
                )}
              </button>
            </div>
          </form>
        )}

        {step === 'done' && receipt && (
          <div className="done">
            <div className="done-icon" aria-hidden="true">✓</div>
            <h2 id="upgrade-title">¡Pago aprobado!</h2>
            <p>
              Ahora tienes el plan <PlanBadge plan={receipt.newPlan} size="sm" />
            </p>
            <dl className="receipt">
              <div>
                <dt>Transacción</dt>
                <dd>{receipt.transactionId}</dd>
              </div>
              <div>
                <dt>Plan anterior</dt>
                <dd>{receipt.previousPlan}</dd>
              </div>
              {receipt.cardLast4 && (
                <div>
                  <dt>Tarjeta</dt>
                  <dd>•••• {receipt.cardLast4}</dd>
                </div>
              )}
            </dl>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={onClose} autoFocus>
                Seguir chateando
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
