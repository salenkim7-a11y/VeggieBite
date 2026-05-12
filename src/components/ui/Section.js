export default function Section({ className = '', ...props }) {
  return <section className={`py-10 sm:py-14 ${className}`.trim()} {...props} />;
}

