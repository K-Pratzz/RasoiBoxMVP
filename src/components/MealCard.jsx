import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isOrderable, isSoldOut, money } from '../lib/utils';
import { Modal, SmartImage, Stars, VegDot } from './ui';

export function useAddToCart() {
  const { currentUser, addToCart, toast } = useApp();
  const navigate = useNavigate();
  const loc = useLocation();
  return (meal, qty = 1) => {
    if (!currentUser) {
      toast('Please log in as a customer to order.');
      navigate('/login', { state: { from: loc.pathname + loc.search } });
      return false;
    }
    const r = addToCart(meal.id, qty);
    toast(r.ok ? `Added ${qty} × ${meal.name} to your cart` : r.error, r.ok ? 'ok' : 'error');
    return r.ok;
  };
}

export function MealCard({ meal }) {
  const { sellerById } = useApp();
  const [open, setOpen] = useState(false);
  const add = useAddToCart();
  const seller = sellerById(meal.sellerId);
  const sold = isSoldOut(meal);
  return (
    <>
      <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
        <button className="relative block aspect-[4/3] overflow-hidden text-left" onClick={() => setOpen(true)} aria-label={`View ${meal.name}`}>
          <SmartImage src={meal.image} alt={meal.name} className={`h-full w-full transition duration-500 group-hover:scale-105 ${sold ? 'grayscale' : ''}`} />
          <span className="absolute left-3 top-3 chip bg-cream/95 text-brand-800">{meal.category}</span>
          {sold && <span className="absolute inset-0 flex items-center justify-center bg-brand-950/55 font-display text-xl font-bold text-cream">Sold out</span>}
        </button>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold leading-snug text-brand-900">{meal.name}</h3>
            <VegDot veg={meal.veg} />
          </div>
          <p className="mt-1 text-xs text-brand-900/60">by {seller?.kitchenName} · {seller?.locality}</p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <div className="font-display text-xl font-bold text-brand-800">{money(meal.price)}</div>
              <div className="text-xs text-brand-900/60">{sold ? 'Not available' : meal.quantity <= 5 ? `Only ${meal.quantity} left` : `${meal.quantity} available`}</div>
            </div>
            <button className="btn-primary btn-sm" disabled={!isOrderable(meal)} onClick={() => add(meal)}>Add to cart</button>
          </div>
        </div>
      </article>
      {open && <MealModal meal={meal} onClose={() => setOpen(false)} />}
    </>
  );
}

export function MealModal({ meal, onClose }) {
  const { sellerById, sellerRating, reviews, cartLines } = useApp();
  const add = useAddToCart();
  const navigate = useNavigate();
  const seller = sellerById(meal.sellerId);
  const rating = sellerRating(meal.sellerId);
  const inCart = cartLines.find((l) => l.mealId === meal.id)?.qty || 0;
  const left = Math.max(0, meal.quantity - inCart);
  const [qty, setQty] = useState(1);
  const sellerReviews = reviews.filter((r) => r.sellerId === meal.sellerId).slice(-3).reverse();
  const ok = isOrderable(meal) && left > 0;
  return (
    <Modal title={meal.name} onClose={onClose} wide>
      <div className="grid gap-5 sm:grid-cols-2">
        <SmartImage src={meal.image} alt={meal.name} className="aspect-[4/3] w-full rounded-2xl" />
        <div>
          <div className="flex items-center gap-2"><VegDot veg={meal.veg} /><span className="chip bg-brand-100 text-brand-800">{meal.category}</span></div>
          <p className="mt-3 text-sm text-brand-900/80">{meal.description}</p>
          <div className="mt-3 font-display text-3xl font-bold text-brand-800">{money(meal.price)}</div>
          <ul className="mt-2 space-y-1 text-sm text-brand-900/70">
            <li>📦 {isSoldOut(meal) ? 'Sold out' : `${meal.quantity} available`}</li>
            <li>🏠 Pickup {meal.fulfilment.pickup ? '✓' : '✗'} · 🛵 Delivery {meal.fulfilment.delivery ? `✓ (${money(meal.deliveryCharge)})` : '✗'}</li>
            <li>💵 Cash on pickup / delivery</li>
          </ul>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-brand-900/15 bg-white">
              <button className="h-9 w-9 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
              <span className="w-8 text-center text-sm font-bold" aria-live="polite">{qty}</span>
              <button className="h-9 w-9 text-lg" onClick={() => setQty((q) => Math.min(Math.max(left, 1), q + 1))} aria-label="Increase">+</button>
            </div>
            <button className="btn-primary flex-1" disabled={!ok} onClick={() => { if (add(meal, qty)) onClose(); }}>
              {ok ? `Add · ${money(meal.price * qty)}` : isOrderable(meal) ? 'Max already in cart' : 'Unavailable'}
            </button>
          </div>
          {inCart > 0 && <button className="mt-2 text-sm font-semibold text-brand-600 underline" onClick={() => { onClose(); navigate('/cart'); }}>{inCart} in your cart · View cart</button>}
        </div>
      </div>
      <div className="mt-6 flex gap-3 rounded-2xl bg-white p-4 shadow-card">
        <SmartImage src={seller?.image} kind="cook" alt={seller?.kitchenName} className="h-14 w-14 shrink-0 rounded-full" />
        <div className="min-w-0">
          <div className="font-bold text-brand-800">{seller?.kitchenName}</div>
          <div className="text-xs text-brand-900/60">{seller?.cuisine} · {seller?.locality}, {seller?.city}</div>
          <div className="mt-0.5 text-xs">{rating.count ? <><Stars value={rating.avg} /> <span className="text-brand-900/60">{rating.avg.toFixed(1)} ({rating.count})</span></> : <span className="text-brand-900/60">No reviews yet</span>}</div>
          <p className="mt-1 text-sm text-brand-900/75">{seller?.bio}</p>
        </div>
      </div>
      {sellerReviews.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-bold text-brand-800">Recent reviews</h4>
          <ul className="space-y-2">
            {sellerReviews.map((r) => (
              <li key={r.id} className="rounded-xl bg-white p-3 text-sm shadow-card"><Stars value={r.rating} /> <b className="ml-1">{r.customerName}</b><p className="text-brand-900/70">{r.comment || 'No comment.'}</p></li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
