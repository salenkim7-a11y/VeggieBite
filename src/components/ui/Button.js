export default function Button({
  as: Comp = 'button',
  variant = 'default',
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 font-semibold outline-none transition motion-reduce:transition-none focus-visible:ring-4 focus-visible:ring-emerald-500/20';

  const variants = {
    default: 'border border-[color:var(--border)] bg-[color:var(--surface)] hover:brightness-[0.98]',
    primary:
      'border border-transparent bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-sm hover:from-emerald-600 hover:to-emerald-400',
    ghost: 'border border-transparent bg-transparent hover:bg-[color:var(--surface)]',
  };

  return <Comp className={`${base} ${variants[variant] || variants.default} ${className}`.trim()} {...props} />;
}

