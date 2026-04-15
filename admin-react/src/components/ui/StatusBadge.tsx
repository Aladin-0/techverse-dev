type Variant = 'pending' | 'processing' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  status: string;
  variant?: Variant;
}

const variantStyles: Record<Variant, { bg: string; color: string }> = {
  pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  processing: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  completed: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  cancelled: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
};

function autoDetectVariant(status: string): Variant {
  const s = status.toUpperCase().replace(/[_\s-]/g, '');
  if (['PENDING', 'SUBMITTED', 'DRAFT', 'NEW'].includes(s)) return 'pending';
  if (['PROCESSING', 'ASSIGNED', 'INPROGRESS', 'SHIPPED', 'DISPATCHED', 'ONTHEWAY'].includes(s))
    return 'processing';
  if (['DELIVERED', 'COMPLETED', 'DONE', 'RESOLVED', 'PAID', 'ACTIVE'].includes(s))
    return 'completed';
  if (['CANCELLED', 'REJECTED', 'FAILED', 'REFUNDED', 'EXPIRED'].includes(s)) return 'cancelled';
  return 'pending';
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolved = variant || autoDetectVariant(status);
  const style = variantStyles[resolved];

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{
        background: style.bg,
        color: style.color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ background: style.color }}
      />
      {status}
    </span>
  );
}
