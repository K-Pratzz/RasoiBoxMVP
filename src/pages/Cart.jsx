import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isOrderable, money, splitAmount, validators } from '../lib/utils';
import { Empty, Field, SmartImage, VegDot } from '../components/ui';

export default function Cart() {
  const { currentUser, cartLines, sellerById, setCartQty, removeFromCart, placeOrders, toast } = useApp();
  const navigate = useNavigate();
  const [fulfil, setFulfil] = useState({});
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [address, setAddress] = useState(`${currentUser.locality}, ${currentUser.city}`);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  const groups = useMemo(() => {
    const g = {};
    cartLines.forEach((l) => { (g[l.meal.sellerId] ||= []).push(l); });
    return Object.entries(g).map(([sid, lines]) => {
      const canPickup = lines.every((l) => l.meal.fulfilment.pickup);
      const canDeliver = lines.every((l) => l.meal.fulfilment.delivery);
      const mode = fulfil[sid] && ((fulfil[sid] === 'pickup' && canPickup) || (fulfil[sid] === 'delivery' && canDeliver)) ? fulfil[sid] : canPickup ? 'pickup' : 'delivery';
      const subtotal = lines.reduce((s, l) => s + l.meal.price * l.qty, 0);
      const deliveryCharge = mode === 'delivery' ? Math.max(...lines.map((l) => l.meal.deliveryCharge || 0)) : 0;
      return { sid, seller: sellerById(sid), lines, canPickup, canDeliver, mode, subtotal, deliveryCharge, ...splitAmount(subtotal, deliveryCharge) };
    });
  }, [cartLines, fulfil, sellerById]);

  const total = groups.reduce((s, g) => s + g.subtotal + g.deliveryCharge, 0);
  const needsAddress = groups.some((g) => g.mode === 'delivery');
  const blocked = cartLines.some((l) => !isOrderable(l.meal) || l.qty > l.meal.quantity);

  if (!cartLines.length) {
    return <div className="container-x py-12"><Empty icon="🛒" title="Your cart is empty">Find something tasty first.<div className="mt-4"><Link to="/meals" className="btn-primary">Browse meals</Link></div></Empty></div>;
  }

  const qty = (l, n) => { const r = setCartQty(l.mealId, n); if (r && !r.ok) toast(r.error, 'error'); };

  const place = (e) => {
    e.preventDefault();
    const er = {};
    if (!validators.phone(phone)) er.phone = 'Enter a valid 10-digit mobile number.';
    if (needsAddress && address.trim().length < 8) er.address = 'Enter your full delivery address.';
    setErrors(er);
    if (Object.keys(er).length) return;
    const fulfilments = Object.fromEntries(groups.map((g) => [g.sid, g.mode]));
    const r = placeOrders({ fulfilments, address: address.trim(), phone: phone.trim(), note: note.trim() });
    if (!r.ok) return toast(r.error, 'error');
    toast('Order placed! 🎉');
    navigate(`/order-confirmation/${r.orderIds.join(',')}`);
  };

  return (
    <form onSubmit={place} className="container-x grid gap-6 py-8 lg:grid-cols-[1fr_360px]" noValidate>
      <div className="space-y-5">
        <h1 className="text-3xl font-bold text-brand-800">Your cart</h1>
        {groups.map((g) => (
          <section key={g.sid} className="card p-4 sm:p-5">
            <h2 className="font-display text-lg font-bold text-brand-800">🍳 {g.seller?.kitchenName} <span className="text-sm font-normal text-brand-900/60">· {g.seller?.locality}</span></h2>
            <ul className="mt-3 divide-y divide-brand-900/10">
              {g.lines.map((l) => (
                <li key={l.mealId} className="flex items-center gap-3 py-3">
                  <SmartImage src={l.meal.image} alt={l.meal.name} className="h-16 w-16 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold"><VegDot veg={l.meal.veg} /><span className="truncate">{l.meal.name}</span></div>
                    <div className="text-xs text-brand-900/60">{money(l.meal.price)} each · {l.meal.quantity} left</div>
                    {!isOrderable(l.meal) && <div className="text-xs font-semibold text-red-600">No longer available. Please remove.</div>}
                    {isOrderable(l.meal) && l.qty > l.meal.quantity && <div className="text-xs font-semibold text-red-600">Only {l.meal.quantity} left. Reduce quantity.</div>}
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-brand-900/15">
                        <button type="button" className="h-8 w-8" aria-label={`Decrease ${l.meal.name}`} onClick={() => qty(l, l.qty - 1)}>−</button>
                        <span className="w-7 text-center text-sm font-bold">{l.qty}</span>
                        <button type="button" className="h-8 w-8" aria-label={`Increase ${l.meal.name}`} onClick={() => qty(l, l.qty + 1)}>+</button>
                      </div>
                      <button type="button" className="text-xs font-semibold text-red-600 underline" onClick={() => removeFromCart(l.mealId)}>Remove</button>
                    </div>
                  </div>
                  <div className="font-bold">{money(l.meal.price * l.qty)}</div>
                </li>
              ))}
            </ul>
            <fieldset className="mt-3 flex flex-wrap gap-2">
              <legend className="label">How do you want it?</legend>
              {[['pickup', '🏠 Pickup (free)', g.canPickup], ['delivery', `🛵 Delivery (+${money(Math.max(...g.lines.map((l) => l.meal.deliveryCharge || 0)))})`, g.canDeliver]].map(([v, label, ok]) => (
                <label key={v} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold ${g.mode === v ? 'border-brand-800 bg-brand-800 text-cream' : 'border-brand-900/20 bg-white'} ${!ok ? 'cursor-not-allowed opacity-40' : ''}`}>
                  <input type="radio" className="sr-only" name={`ful-${g.sid}`} disabled={!ok} checked={g.mode === v} onChange={() => setFulfil((f) => ({ ...f, [g.sid]: v }))} />{label}{!ok && ' (n/a)'}
                </label>
              ))}
            </fieldset>
          </section>
        ))}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card space-y-4 p-5">
          <h2 className="text-xl font-bold text-brand-800">Checkout</h2>
          <Field label="Mobile number" error={errors.phone}><input className="input" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          {needsAddress && <Field label="Delivery address" error={errors.address}><textarea className="input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} /></Field>}
          <Field label="Note for the cook (optional)"><input className="input" maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Less spicy, please" /></Field>
          <dl className="space-y-1 border-t border-brand-900/10 pt-3 text-sm">
            <div className="flex justify-between"><dt>Food</dt><dd>{money(groups.reduce((s, g) => s + g.subtotal, 0))}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{money(groups.reduce((s, g) => s + g.deliveryCharge, 0))}</dd></div>
            <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{money(total)}</dd></div>
            <div className="flex justify-between text-xs text-brand-900/60"><dt>Rasoibox commission (10% of food, paid by cook)</dt><dd>{money(groups.reduce((s, g) => s + g.commission, 0))}</dd></div>
          </dl>
          <p className="rounded-xl bg-sun/20 p-3 text-xs text-brand-900">💵 Pay in cash on pickup or delivery. No online payment in this demo.</p>
          {groups.length > 1 && <p className="text-xs text-brand-900/60">Your cart has meals from {groups.length} cooks, so they will be placed as {groups.length} separate orders.</p>}
          <button className="btn-primary w-full py-3" disabled={blocked}>Place order · {money(total)}</button>
          {blocked && <p className="text-xs font-medium text-red-600">Fix the unavailable items above to continue.</p>}
        </div>
      </aside>
    </form>
  );
}
