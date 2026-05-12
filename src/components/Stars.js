export default function Stars({ count = 5 }) {
  const n = Math.max(0, Math.min(5, Number(count) || 0));
  return (
    <span className="stars" aria-label={`${n} out of 5 stars`}>
      {'★★★★★'.slice(0, n)}
      <span className="muted">{'★★★★★'.slice(0, 5 - n)}</span>
    </span>
  );
}

