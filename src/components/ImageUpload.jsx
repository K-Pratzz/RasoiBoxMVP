import { useRef, useState } from 'react';
import { compressImage } from '../lib/utils';
import { SmartImage } from './ui';

export default function ImageUpload({ value, onChange, kind = 'meal', label = 'Photo' }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError('');
    try { onChange(await compressImage(file)); } catch (err) { setError(err.message); }
    setBusy(false);
    e.target.value = '';
  };
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-3">
        <SmartImage src={value} kind={kind} alt="Preview" className={`h-20 w-20 rounded-xl ${kind === 'cook' ? 'rounded-full' : ''}`} />
        <div className="space-y-1">
          <input ref={ref} type="file" accept="image/*" className="sr-only" onChange={pick} aria-label={`Upload ${label}`} />
          <button type="button" className="btn-outline btn-sm" disabled={busy} onClick={() => ref.current?.click()}>{busy ? 'Processing…' : value ? 'Change photo' : 'Upload from device'}</button>
          {value && <button type="button" className="ml-2 text-xs font-semibold text-red-600 underline" onClick={() => onChange('')}>Remove</button>}
          <p className="text-xs text-brand-900/60">Resized to ≤800px and compressed (~150 KB) so it fits in browser storage (about 5 MB total, roughly 25–30 photos).</p>
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
