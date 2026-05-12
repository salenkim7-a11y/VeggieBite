export default function Footer({ business }) {
  return (
    <footer className="footer">
      <div className="footerInner">
        <div className="footerCol">
          <div className="footerTitle">{business.name}</div>
          <div className="muted">{business.tagline}</div>
          <div className="muted">{business.location}</div>
        </div>

        <div className="footerCol">
          <div className="footerTitle">Contact</div>
          <div className="muted">{business.contactNumber}</div>
          <div className="muted">{business.email}</div>
          <div className="muted">{business.facebook}</div>
        </div>

        <div className="footerCol">
          <div className="footerTitle">Delivery</div>
          <div className="muted">{business.shippingPolicy}</div>
        </div>
      </div>
      <div className="footerBottom muted">© {new Date().getFullYear()} {business.name}</div>
    </footer>
  );
}

