import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { validators } from '../lib/utils';
import { Field } from '../components/ui';

const DEMO = [
  ['Customer', 'aarav@demo.com', 'demo123'],
  ['Home cook', 'sunita@demo.com', 'demo123'],
  ['Admin (demo)', 'admin@rasoibox.demo', 'admin123'],
];

const Shell = ({ title, sub, children }) => (
  <div className="container-x flex justify-center py-10 sm:py-14">
    <div className="w-full max-w-lg">
      <h1 className="text-3xl font-bold text-brand-800">{title}</h1>
      <p className="mt-1 text-sm text-brand-900/70">{sub}</p>
      <div className="mt-5">{children}</div>
    </div>
  </div>
);

export function Login() {
  const { login, toast } = useApp();
  const navigate = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '', remember: true });
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!validators.email(f.email) || !f.password) return setError('Enter your email and password.');
    const r = login(f.email, f.password, f.remember);
    if (!r.ok) return setError(r.error);
    toast(`Welcome back, ${r.user.name.split(' ')[0]}!`);
    navigate(loc.state?.from || '/dashboard', { replace: true });
  };

  return (
    <Shell title="Welcome back" sub="Log in to order meals or manage your kitchen.">
      <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6" noValidate>
        <Field label="Email"><input className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><input className="input" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.remember} onChange={(e) => setF({ ...f, remember: e.target.checked })} /> Keep me signed in on this browser</label>
        {error && <p className="rounded-lg bg-red-50 p-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
        <button className="btn-primary w-full py-3">Log in</button>
        <p className="text-center text-sm">New here? <Link to="/register" className="font-semibold text-brand-600 underline">Create an account</Link></p>
      </form>
      <div className="mt-5 rounded-2xl border border-dashed border-brand-800/30 bg-white/60 p-4">
        <div className="text-sm font-bold text-brand-800">Demo accounts</div>
        <p className="text-xs text-brand-900/60">Tap to fill the form. The admin role is demo-only and is not real security.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO.map(([label, email, password]) => (
            <button key={email} type="button" className="btn-outline btn-sm" onClick={() => { setF({ ...f, email, password }); setError(''); }}>{label}</button>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function Register() {
  const { register, toast } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '', role: params.get('type') === 'cook' ? 'cook' : 'customer', city: '', locality: '' });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (f.name.trim().length < 2) er.name = 'Enter your full name.';
    if (!validators.email(f.email)) er.email = 'Enter a valid email address.';
    if (!validators.phone(f.phone)) er.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (f.password.length < 6) er.password = 'Use at least 6 characters.';
    if (f.confirm !== f.password) er.confirm = 'Passwords do not match.';
    if (!f.city.trim()) er.city = 'City is required.';
    if (!f.locality.trim()) er.locality = 'Locality is required.';
    setErrors(er);
    if (Object.keys(er).length) return;
    const r = register(f);
    if (!r.ok) return setErrors({ email: r.error });
    toast('Account created! Welcome to Rasoibox.');
    navigate('/dashboard', { replace: true });
  };

  return (
    <Shell title="Create your account" sub="Join Rasoibox as a customer or a home cook.">
      <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6" noValidate>
        <fieldset>
          <legend className="label">I want to</legend>
          <div className="grid grid-cols-2 gap-2">
            {[['customer', '😋 Order food'], ['cook', '👩‍🍳 Sell my cooking']].map(([v, l]) => (
              <label key={v} className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-semibold ${f.role === v ? 'border-brand-800 bg-brand-800 text-cream' : 'border-brand-900/20 bg-white'}`}>
                <input type="radio" className="sr-only" name="role" checked={f.role === v} onChange={() => setF({ ...f, role: v })} />{l}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name}><input className="input" autoComplete="name" value={f.name} onChange={set('name')} /></Field>
          <Field label="Mobile number" error={errors.phone}><input className="input" inputMode="numeric" maxLength={10} value={f.phone} onChange={set('phone')} /></Field>
        </div>
        <Field label="Email" error={errors.email}><input className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" error={errors.password}><input className="input" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
          <Field label="Confirm password" error={errors.confirm}><input className="input" type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" error={errors.city}><input className="input" value={f.city} onChange={set('city')} /></Field>
          <Field label="Locality" error={errors.locality}><input className="input" value={f.locality} onChange={set('locality')} /></Field>
        </div>
        <p className="rounded-xl bg-sun/20 p-3 text-xs text-brand-900">⚠️ Demo only: details are saved in this browser's localStorage and are <b>not secure</b>. Use fake details and a throw-away password, never a real one.</p>
        <button className="btn-primary w-full py-3">Create account</button>
        <p className="text-center text-sm">Already registered? <Link to="/login" className="font-semibold text-brand-600 underline">Log in</Link></p>
      </form>
    </Shell>
  );
}
