import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ConfirmModal, Logo, Toasts } from './ui';
import { storageUsageKB } from '../lib/storage';

export function goSection(navigate, pathname, id) {
  if (pathname === '/') document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  else navigate('/', { state: { scrollTo: id } });
}

function Navbar() {
  const { currentUser, cartCount, logout, toast } = useApp();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  const link = ({ isActive }) => `rounded-full px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand-100 text-brand-800' : 'text-brand-800 hover:bg-brand-50'}`;
  const dash = currentUser ? '/dashboard' : '/login';
  const doLogout = () => { logout(); toast('Signed out. See you soon!'); navigate('/'); };

  const items = (
    <>
      <NavLink to="/" end className={link}>Home</NavLink>
      <NavLink to="/meals" className={link}>Browse Meals</NavLink>
      <button className="rounded-full px-3 py-2 text-left text-sm font-semibold text-brand-800 hover:bg-brand-50" onClick={() => goSection(navigate, pathname, 'how')}>How it works</button>
      {(!currentUser || currentUser.role === 'cook') && (
        <NavLink to={currentUser ? '/dashboard' : '/register?type=cook'} className={link}>Become a Seller</NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-brand-900/10 bg-cream/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">{items}</nav>
        <div className="flex items-center gap-2">
          {currentUser?.role === 'customer' && (
            <Link to="/cart" className="btn-outline btn-sm relative" aria-label={`Cart, ${cartCount} items`}>
              🛒 <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sun px-1 text-[11px] font-bold text-brand-900">{cartCount}</span>}
            </Link>
          )}
          {currentUser ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link to={dash} className="btn-primary btn-sm">{currentUser.name.split(' ')[0]}'s dashboard</Link>
              <button className="btn-outline btn-sm" onClick={doLogout}>Log out</button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="btn-outline btn-sm">Log in</Link>
              <Link to="/register" className="btn-primary btn-sm">Sign up</Link>
            </div>
          )}
          <button className="rounded-full p-2 text-2xl leading-none text-brand-800 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>{open ? '✕' : '☰'}</button>
        </div>
      </div>
      {open && (
        <div className="container-x flex flex-col gap-1 border-t border-brand-900/10 pb-4 pt-2 md:hidden">
          {items}
          {currentUser ? (
            <>
              <Link to={dash} className="btn-primary mt-2">My dashboard</Link>
              <button className="btn-outline" onClick={doLogout}>Log out</button>
            </>
          ) : (
            <div className="mt-2 flex gap-2">
              <Link to="/login" className="btn-outline flex-1">Log in</Link>
              <Link to="/register" className="btn-primary flex-1">Sign up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { resetDemo, toast } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [confirm, setConfirm] = useState(false);
  return (
    <footer className="mt-10 bg-brand-900 text-cream">
      <div className="container-x grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-3 max-w-sm text-sm text-cream/70">Home food, closer to you. Rasoibox connects neighbours with home cooks for fresh, affordable, home-style meals.</p>
          <p className="mt-4 max-w-sm rounded-xl bg-white/10 p-3 text-xs text-cream/80">
            ⚠️ This is a frontend-only <b>demo</b>. Accounts, orders and photos are saved only in this browser's localStorage (about 5 MB). Sign-in is not secure authentication — use fake details and never a real password.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-sun">Explore</h4>
          <ul className="space-y-2 text-sm text-cream/80">
            <li><Link className="hover:text-white" to="/meals">Browse meals</Link></li>
            <li><button className="hover:text-white" onClick={() => goSection(navigate, pathname, 'how')}>How it works</button></li>
            <li><Link className="hover:text-white" to="/register?type=cook">Become a seller</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-sun">Account & demo</h4>
          <ul className="space-y-2 text-sm text-cream/80">
            <li><Link className="hover:text-white" to="/login">Log in</Link></li>
            <li><Link className="hover:text-white" to="/register">Create account</Link></li>
            <li><button className="hover:text-white" onClick={() => setConfirm(true)}>Reset demo data</button></li>
          </ul>
          <p className="mt-3 text-xs text-cream/50">Storage used: {storageUsageKB()} KB</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-cream/60">© {new Date().getFullYear()} Rasoibox demo · Platform commission 10% · Cash on pickup / delivery only</div>
      {confirm && (
        <ConfirmModal title="Reset demo data?" danger confirmLabel="Reset everything"
          message="This erases all accounts, meals, photos, carts and orders saved in this browser and restores the original sample data."
          onConfirm={() => { resetDemo(); toast('Demo data reset to the original samples.'); navigate('/'); }}
          onClose={() => setConfirm(false)} />
      )}
    </footer>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { if (!window.history.state?.usr?.scrollTo) window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <Toasts />
    </div>
  );
}
