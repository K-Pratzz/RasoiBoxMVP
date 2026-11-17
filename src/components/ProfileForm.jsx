import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { validators } from '../lib/utils';
import { Field } from './ui';

export default function ProfileForm() {
  const { currentUser, updateProfile, toast } = useApp();
  const [f, setF] = useState({ name: currentUser.name, phone: currentUser.phone, city: currentUser.city, locality: currentUser.locality, password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (f.name.trim().length < 2) er.name = 'Enter your full name.';
    if (!validators.phone(f.phone)) er.phone = 'Enter a valid 10-digit mobile number.';
    if (!f.city.trim()) er.city = 'City is required.';
    if (!f.locality.trim()) er.locality = 'Locality is required.';
    if (f.password) {
      if (f.password.length < 6) er.password = 'Use at least 6 characters.';
      if (f.password !== f.confirm) er.confirm = 'Passwords do not match.';
    }
    setErrors(er);
    if (Object.keys(er).length) return;
    const patch = { name: f.name.trim(), phone: f.phone.trim(), city: f.city.trim(), locality: f.locality.trim() };
    if (f.password) patch.password = f.password;
    updateProfile(patch);
    setF((s) => ({ ...s, password: '', confirm: '' }));
    toast('Profile updated.');
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4 p-5 sm:p-6" noValidate>
      <h3 className="text-xl font-bold text-brand-800">Edit profile</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.name}><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="Email" hint="Email can't be changed in the demo."><input className="input bg-brand-50" value={currentUser.email} readOnly /></Field>
        <Field label="Mobile number" error={errors.phone}><input className="input" inputMode="numeric" maxLength={10} value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Account type"><input className="input bg-brand-50 capitalize" value={currentUser.role === 'cook' ? 'Home cook' : currentUser.role} readOnly /></Field>
        <Field label="City" error={errors.city}><input className="input" value={f.city} onChange={set('city')} /></Field>
        <Field label="Locality" error={errors.locality}><input className="input" value={f.locality} onChange={set('locality')} /></Field>
        <Field label="New demo password (optional)" error={errors.password}><input type="password" className="input" autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
        <Field label="Confirm new password" error={errors.confirm}><input type="password" className="input" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} /></Field>
      </div>
      <p className="text-xs text-brand-900/60">Demo only: passwords are saved as plain text in your browser. Never use a real password.</p>
      <button className="btn-primary">Save changes</button>
    </form>
  );
}
