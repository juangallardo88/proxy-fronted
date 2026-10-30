import { useEffect, useRef, useState } from 'react'
import PlanBadge from './PlanBadge.jsx'
import { PLANS, fmt } from '../utils.js'

const ORDER = ['FREE', 'PRO', 'ENTERPRISE']
const TEST_CARD = '4242 4242 4242 4242'

const rpmText = (p) => (PLANS[p].rpm ? `${PLANS[p].rpm} por minuto` : 'Sin límite')
const tokenText = (p) => (PLANS[p].tokens ? `${fmt(PLANS[p].tokens)} al mes` : 'Sin límite')

export default function UpgradeModal({ open, reason, currentPlan, onClose, onUpgrade }) {
  const [step, setStep] = useState('plans') // plans | payment | processing | done
  const [target, setTarget] = useState('PRO')
  const [form, setForm] = useState({ name: '', card: TEST_CARD, exp: '12/30', cvc: '123' })
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)
  const dialogRef = useRef(null)

  const current = currentPlan || 'FREE'
  const options = ORDER.slice(ORDER.indexOf(current) + 1)

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

  useEffect(() => {
    if (open) dialogRef.current?.focus()
  }, [open, step])

  if (!open) return null

  const digits = form.card.replace(/\D/g, '')
  const validCard = digits.length === 16
  const validExp = /^(0[1-9]|1[0-2])\/\d{2}$/.test(form.exp)
  const validCvc = /^\d{3,4}$/.test(form.cvc)
  const validName = form.name.trim().length >= 3
  const canPay = validCard && validExp && validCvc && validName
  const processing = step === 'processing'

  function update(field, value) {
    if (field === 'card') value = value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
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
    await new Promise((r) => setTimeout(r, 1500)) // tiempo de la pasarela simulada
    try {
      const res = await onUpgrade(target, digits.slice(-4))
      setReceipt(res)
      setStep('done')
    } catch (err) {
      setError(err.message || 'El pago no se pudo completar. Intenta de nuevo.')
      setStep('payment')
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !processing && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" tabIndex={-1} ref={dialogRef}>
        {!processing && (
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}

        {step === 'plans' && (
          <>
            <div className="modal-head">
              <h2 id="upgrade-title">{reason === 'quota' ? 'Te quedaste sin tokens este mes' : 'Mejora tu plan'}</h2>
              <p className="muted">
                {reason === 'quota'
                  ? `Tu plan ${PLANS[current].name} ya usó todos sus tokens. Con un plan mayor puedes seguir hoy mismo.`
                  : 'Más requests por minuto y más tokens al mes. El cambio se aplica al instante.'}
              </p>
            </div>

            {options.length === 0 ? (
              <p>Ya tienes el plan más alto disponible.</p>
            ) : (
              <div className="plans" role="radiogroup" aria-label="Planes disponibles">
                {options.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={target === p}
                    className={`plan plan-${p.toLowerCase()} ${target === p ? 'plan-selected' : ''}`}
                    onClick={() => setTarget(p)}
                  >
                    <span className="plan-top">
                      <PlanBadge plan={p} />
                      <span className="plan-radio" aria-hidden="true" />
                    </span>
                    <span className="plan-price">
                      US$ {PLANS[p].price}
                      <small> al mes</small>
                    </span>
                    <span className="plan-compare">
                      <span>Requests</span>
                      <span className="from">{rpmText(current)}</span>
                      <span className="to">{rpmText(p)}</span>
                    </span>
                    <span className="plan-compare">
                      <span>Tokens</span>
                      <span className="from">{tokenText(current)}</span>
                      <span className="to">{tokenText(p)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-quiet" onClick={onClose}>
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

        {(step === 'payment' || processing) && (
          <form onSubmit={pay}>
            <div className="modal-head">
              <h2 id="upgrade-title">Pagar el plan {PLANS[target].name}</h2>
              <p className="sim-note">Es un pago simulado: no se cobra nada. Usa la tarjeta de prueba que ya está escrita.</p>
            </div>

            <div className="card-preview" aria-hidden="true">
              <span className="card-chip" />
              <span className="card-number">{form.card || '•••• •••• •••• ••••'}</span>
              <span className="card-row">
                <span>{form.name || 'Nombre en la tarjeta'}</span>
                <span>{form.exp || 'MM/AA'}</span>
              </span>
            </div>

            <label className="field">
              <span>Nombre en la tarjeta</span>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Como aparece en la tarjeta"
                autoComplete="off"
                disabled={processing}
              />
            </label>
            <label className="field">
              <span>Número de tarjeta</span>
              <input
                value={form.card}
                onChange={(e) => update('card', e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                disabled={processing}
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Vence</span>
                <input value={form.exp} onChange={(e) => update('exp', e.target.value)} placeholder="MM/AA" disabled={processing} />
              </label>
              <label className="field">
                <span>CVC</span>
                <input
                  value={form.cvc}
                  onChange={(e) => update('cvc', e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  disabled={processing}
                />
              </label>
            </div>

            {error && <p className="error-text" role="alert">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn btn-quiet" onClick={() => setStep('plans')} disabled={processing}>
                Volver
              </button>
              <button type="submit" className="btn btn-primary" disabled={!canPay || processing}>
                {processing ? (
                  <>
                    <span className="spinner" aria-hidden="true" /> Procesando pago
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
            <svg className="done-mark" viewBox="0 0 52 52" aria-hidden="true">
              <circle cx="26" cy="26" r="24" />
              <path d="M15 27l7 7 15-15" />
            </svg>
            <h2 id="upgrade-title">Pago aprobado</h2>
            <p className="muted">
              Ya tienes el plan <PlanBadge plan={receipt.newPlan} size="sm" /> y tus nuevos límites están activos.
            </p>
            <dl className="receipt">
              <div>
                <dt>Transacción</dt>
                <dd>{receipt.transactionId}</dd>
              </div>
              <div>
                <dt>Cambio</dt>
                <dd>
                  {PLANS[receipt.previousPlan]?.name || receipt.previousPlan} a {PLANS[receipt.newPlan]?.name || receipt.newPlan}
                </dd>
              </div>
              {receipt.cardLast4 && (
                <div>
                  <dt>Tarjeta</dt>
                  <dd>Terminada en {receipt.cardLast4}</dd>
                </div>
              )}
            </dl>
            <button className="btn btn-primary btn-wide" onClick={onClose}>
              Volver al chat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
