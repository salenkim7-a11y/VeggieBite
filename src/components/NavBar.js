import { useEffect } from 'react';
import brandLogo from '../assets/veggiebite-logo.png';

function NavLink({ active, children, onClick, badge }) {
  return (
    <button className={`navLink ${active ? 'active' : ''}`} onClick={onClick} type="button">
      <span>{children}</span>
      {badge != null && badge !== 0 ? <span className="navBadge">{badge}</span> : null}
    </button>
  );
}

export default function NavBar({
  business,
  page,
  onNavigate,
  cartItemCount,
  mobileOpen,
  setMobileOpen,
  onAdminClick,
  theme,
  onToggleTheme,
}) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    if (!mobileOpen) return undefined;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, setMobileOpen]);

  const links = (
    <>
      <NavLink active={page === 'home'} onClick={() => onNavigate('home')}>
        Home
      </NavLink>
      <NavLink active={page === 'products'} onClick={() => onNavigate('products')}>
        Products
      </NavLink>
      <NavLink
        active={page === 'checkout'}
        onClick={() => onNavigate('checkout')}
        badge={cartItemCount}
      >
        Checkout
      </NavLink>
      <NavLink active={page === 'admin'} onClick={onAdminClick}>
        Admin
      </NavLink>
    </>
  );

  const themeLabel = theme === 'dark' ? 'Light Mode' : 'Dark Mode';

  return (
    <header className="navHeader">
      <div className="navInner">
        <button className="brand" onClick={() => onNavigate('home')} type="button">
          <span className="brandMark">
            <img className="brandLogo" src={brandLogo} alt={`${business.name} logo`} />
          </span>
          <span className="brandText">
            <span className="brandName">{business.name}</span>
            <span className="brandTagline">{business.tagline}</span>
          </span>
        </button>

        <nav className="navDesktop" aria-label="Primary">
          {links}
          <button className="navLink" onClick={onToggleTheme} type="button">
            {themeLabel}
          </button>
        </nav>

        <button
          className="hamburger"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen ? 'true' : 'false'}
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
        >
          <span className="hamburgerBars" aria-hidden="true" />
        </button>
      </div>

      {mobileOpen ? (
        <div className="navMobile" role="dialog" aria-modal="true">
          <div className="navMobilePanel">
            {links}
            <button className="navLink" onClick={onToggleTheme} type="button">
              {themeLabel}
            </button>
            <div className="navMobileMeta">
              <div className="muted">{business.location}</div>
              <div className="muted">{business.businessHours}</div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

