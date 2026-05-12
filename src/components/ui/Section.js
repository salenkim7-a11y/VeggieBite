export default function Section({ className = '', ...props }) {
  return <section className={`py-12 sm:py-16 ${className}`.trim()} {...props} />;
}
