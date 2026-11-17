import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statusTone } from '../lib/utils';
import { useApp } from '../context/AppContext';

const BASE = import.meta.env.BASE_URL;

export function SmartImage({ src, alt, kind = 'meal', className = '' }) {
  const fallback = `${BASE}fallback-${kind}.svg`;
  const [url, setUrl] = useState(src || fallback);
  useEffect(() => setUrl(src || fallback), [src, fallback]);
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => url !== fallback && setUrl(fallback)}
      className={`object-cover ${className}`}
    />
  );
}

export function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Rasoibox home">
      <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill={light ? '#faf5e6' : '#173f31'} />
        <path d="M14 30 32 14l18 16v20a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2z" fill={light ? '#173f31' : '#faf5e6'} />
        <path d="M24 40c0-6 16-6 16 0 0 5-4 8-8 8s-8-3-8-8z" fill="#f2c94c" />
      </svg>
      <span className={`font-display text-2xl font-bold ${light ? 'text-cream' : 'text-brand-800'}`}>Rasoi<span className="text-sun-500">box</span></span>
    </Link>
  );
}

export function StatusBadge({ status }) {
  return <span className={`chip ${statusTone[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
}

export function VegDot({ veg }) {
  return (
    <span title={veg ? 'Vegetarian' : 'Non-vegetarian'} className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border-2 ${veg ? 'border-green-600' : 'border-red-600'}`}>
      <span className={`h-2 w-2 rounded-full ${veg ? 'bg-green-600' : 'bg-red-600'}`} />
    </span>
  );
}

export function Stars({ value, size = 'text-sm' }) {
  return (
    <span className={`${size} text-sun-500`} aria-label={`${value.toFixed(1)} out of 5`}>
      {'★'.repeat(Math.round(value))}<span className="text-brand-900/20">{'★'.repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-brand-900/60">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/60 p-0 sm:items-center sm:p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-cream sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-900/10 bg-cream px-5 py-3">
          <h3 className="text-lg font-bold text-brand-800">{title}</h3>
          <button className="rounded-full p-2 text-xl leading-none text-brand-800 hover:bg-brand-100" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-brand-900/80">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto max-w-md rounded-full px-5 py-2.5 text-sm font-medium shadow-lift ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-800 text-cream'}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function StatCard({ label, value, sub, tone = 'bg-white' }) {
  return (
    <div className={`card p-4 ${tone}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-brand-800/70">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-brand-800">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-brand-900/60">{sub}</div>}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
      <div className="inline-flex gap-1 rounded-full bg-white p-1 shadow-card">
        {tabs.map(([id, label, count]) => (
          <button key={id} role="tab" aria-selected={active === id} onClick={() => onChange(id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${active === id ? 'bg-brand-800 text-cream' : 'text-brand-800 hover:bg-brand-50'}`}>
            {label}{count ? <span className="ml-1.5 rounded-full bg-sun px-1.5 py-0.5 text-[10px] text-brand-900">{count}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Empty({ icon = '🍽️', title, children }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-2 text-lg font-bold text-brand-800">{title}</h3>
      <div className="mt-1 text-sm text-brand-900/70">{children}</div>
    </div>
  );
}
