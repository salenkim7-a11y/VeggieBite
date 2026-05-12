export default function Card({ as: Comp = 'div', className = '', ...props }) {
  return (
    <Comp
      className={`rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow)] ${className}`.trim()}
      {...props}
    />
  );
}

