export default function PromptCardSkeleton() {
  return (
    <div className="prompt-card skeleton" aria-hidden="true">
      <div className="card-top">
        <span className="skeleton-bar" style={{ width: '40%', height: 10 }} />
        <span className="skeleton-bar" style={{ width: 18, height: 18, borderRadius: '50%' }} />
      </div>
      <span className="skeleton-bar" style={{ width: '70%', height: 17, marginTop: 20 }} />
      <span className="skeleton-bar" style={{ width: '90%', height: 12, marginTop: 10 }} />
      <span className="skeleton-bar" style={{ width: '60%', height: 12, marginTop: 6 }} />
      <span className="skeleton-bar" style={{ width: '30%', height: 10, marginTop: 20 }} />
    </div>
  )
}
