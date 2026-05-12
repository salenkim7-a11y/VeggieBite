export default function Container({ as: Comp = 'div', className = '', ...props }) {
  return (
    <Comp
      className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`.trim()}
      {...props}
    />
  );
}

