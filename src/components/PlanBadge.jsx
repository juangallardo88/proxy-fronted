const LABELS = { FREE: 'Free', PRO: 'Pro', ENTERPRISE: 'Enterprise' }

export default function PlanBadge({ plan, size = 'md' }) {
  if (!plan) return <span className={`badge badge-${size} badge-loading`}>Plan</span>
  return (
    <span className={`badge badge-${size} badge-${plan.toLowerCase()}`} title={`Plan actual: ${LABELS[plan] || plan}`}>
      <span className="badge-dot" aria-hidden="true" />
      {LABELS[plan] || plan}
    </span>
  )
}
