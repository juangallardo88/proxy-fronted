const LABELS = { FREE: 'Free', PRO: 'Pro', ENTERPRISE: 'Enterprise' }

export default function PlanBadge({ plan, size = 'md' }) {
  if (!plan) return <span className="badge badge-loading">…</span>
  return (
    <span className={`badge badge-${plan.toLowerCase()} badge-${size}`} title={`Plan actual: ${plan}`}>
      {plan === 'ENTERPRISE' && <span aria-hidden="true">★ </span>}
      {LABELS[plan] || plan}
    </span>
  )
}
