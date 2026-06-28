export function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', style = {} }) {
  return <div className="skeleton" style={{ width, height, borderRadius, ...style }} />
}

export function SkeletonCard() {
  return (
    <div className="product-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #eee' }}>
      <Skeleton height="180px" borderRadius="0" />
      <div style={{ padding: '1rem' }}>
        <Skeleton height="16px" width="60%" style={{ marginBottom: '0.5rem' }} />
        <Skeleton height="14px" width="40%" style={{ marginBottom: '0.75rem' }} />
        <Skeleton height="36px" borderRadius="18px" />
      </div>
    </div>
  )
}

export function SkeletonOrderCard() {
  return (
    <div className="order-card" style={{ padding: '1.5rem' }}>
      <Skeleton height="18px" width="50%" style={{ marginBottom: '0.75rem' }} />
      <Skeleton height="14px" width="30%" style={{ marginBottom: '0.5rem' }} />
      <Skeleton height="14px" width="40%" style={{ marginBottom: '0.5rem' }} />
      <Skeleton height="36px" width="120px" borderRadius="18px" />
    </div>
  )
}
