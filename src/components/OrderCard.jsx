import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { fmtDate, money, nextActions } from '../lib/utils';
import { Field, Modal, SmartImage, StatusBadge } from './ui';

function Tracker({ order }) {
  const steps = ['Pending', 'Accepted', 'Preparing', order.fulfilment === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup', 'Completed'];
  if (order.status === 'Cancelled') return <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">This order was cancelled. Reserved quantity was returned to the cook.</div>;
  const idx = steps.indexOf(order.status);
  return (
    <ol className="flex items-center gap-1 overflow-x-auto py-1 text-[11px] font-semibold" aria-label="Order progress">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 min-w-[64px] flex-col items-center gap-1 text-center">
          <span className={`h-2 w-full rounded-full ${i <= idx ? 'bg-brand-600' : 'bg-brand-900/10'}`} />
          <span className={i <= idx ? 'text-brand-800' : 'text-brand-900/40'}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

function ReviewModal({ order, onClose }) {
  const { addReview, toast } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const r = addReview(order, rating, comment);
    toast(r.ok ? 'Thanks for your review!' : r.error, r.ok ? 'ok' : 'error');
    onClose();
  };
  return (
    <Modal title={`Review order ${order.id}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-1 text-3xl" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)} className={n <= rating ? 'text-sun-500' : 'text-brand-900/20'}>★</button>
          ))}
        </div>
        <Field label="Comment (optional)"><textarea className="input" rows={3} maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
        <button className="btn-primary w-full">Submit review</button>
      </form>
    </Modal>
  );
}

function ComplaintModal({ order, onClose }) {
  const { addComplaint, toast } = useApp();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (subject.trim().length < 3 || message.trim().length < 10) return setErr('Please add a subject and at least 10 characters of detail.');
    addComplaint(order, subject, message);
    toast('Complaint sent to the Rasoibox admin.');
    onClose();
  };
  return (
    <Modal title={`Report an issue · ${order.id}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Subject"><input className="input" value={subject} maxLength={80} onChange={(e) => setSubject(e.target.value)} /></Field>
        <Field label="What went wrong?" error={err}><textarea className="input" rows={4} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
        <button className="btn-primary w-full">Send complaint</button>
      </form>
    </Modal>
  );
}

/** One order, rendered for the customer, the cook or the admin (viewer). */
export default function OrderCard({ order, viewer }) {
  const { changeOrderStatus, sellerById, reviews, complaints, toast } = useApp();
  const [modal, setModal] = useState(null);
  const seller = sellerById(order.sellerId);
  const reviewed = reviews.some((r) => r.orderId === order.id);
  const myComplaints = complaints.filter((c) => c.orderId === order.id);

  const actions = nextActions(order).filter((a) => (viewer === 'customer' ? a.status === 'Cancelled' && order.status === 'Pending' : true));
  const act = (a) => {
    const r = changeOrderStatus(order.id, a.status);
    toast(r.ok ? `Order ${order.id}: ${a.status}` : r.error, r.ok ? 'ok' : 'error');
  };

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-display text-lg font-bold text-brand-800">{order.id}</div>
          <div className="text-xs text-brand-900/60">{fmtDate(order.createdAt)} · {order.fulfilment === 'delivery' ? '🛵 Delivery' : '🏠 Pickup'} · {order.payment}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-2 text-sm text-brand-900/80">
        {viewer !== 'customer' && <div>👤 <b>{order.customerName}</b> · {order.customerPhone}</div>}
        {viewer !== 'cook' && <div>🍳 <b>{seller?.kitchenName || 'Cook'}</b>{seller ? ` · ${seller.locality}` : ''}</div>}
        {order.address && <div>📍 {order.address}</div>}
        {order.note && <div>📝 “{order.note}”</div>}
      </div>

      <ul className="mt-3 divide-y divide-brand-900/10 rounded-xl bg-cream-100">
        {order.items.map((i) => (
          <li key={i.mealId} className="flex items-center gap-3 p-2.5">
            <SmartImage src={i.image} alt={i.name} className="h-11 w-11 rounded-lg" />
            <span className="flex-1 text-sm font-medium">{i.name} <span className="text-brand-900/50">× {i.qty}</span></span>
            <span className="text-sm font-semibold">{money(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
        <dt className="text-brand-900/70">Food subtotal</dt><dd className="text-right">{money(order.subtotal)}</dd>
        <dt className="text-brand-900/70">Delivery charge</dt><dd className="text-right">{money(order.deliveryCharge)}</dd>
        <dt className="font-bold">Customer pays ({order.payment})</dt><dd className="text-right font-bold">{money(order.total)}</dd>
        <dt className="text-brand-900/70">Rasoibox commission (10% of food)</dt><dd className="text-right text-brand-900/70">− {money(order.commission)}</dd>
        <dt className="font-semibold text-brand-700">Cook earns</dt><dd className="text-right font-semibold text-brand-700">{money(order.sellerEarnings)}</dd>
      </dl>

      <div className="mt-4"><Tracker order={order} /></div>

      {myComplaints.map((c) => (
        <div key={c.id} className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">
          <b>Complaint: {c.subject}</b> <span className={`chip ${c.status === 'open' ? 'bg-amber-200 text-amber-900' : 'bg-brand-100 text-brand-800'}`}>{c.status}</span>
          <p className="text-brand-900/70">{c.message}</p>
          {c.response && <p className="mt-1 text-brand-800"><b>Admin reply:</b> {c.response}</p>}
        </div>
      ))}

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((a) => (
          <button key={a.status} className={`${a.danger ? 'btn-outline text-red-700' : 'btn-primary'} btn-sm`} onClick={() => act(a)}>{viewer === 'customer' ? 'Cancel order' : a.label}</button>
        ))}
        {viewer === 'customer' && order.status === 'Completed' && !reviewed && <button className="btn-sun btn-sm" onClick={() => setModal('review')}>★ Leave a review</button>}
        {viewer === 'customer' && order.status === 'Completed' && reviewed && <span className="chip bg-brand-100 text-brand-800">Reviewed ✓</span>}
        {viewer === 'customer' && <button className="btn-outline btn-sm" onClick={() => setModal('complaint')}>Report an issue</button>}
      </div>
      {modal === 'review' && <ReviewModal order={order} onClose={() => setModal(null)} />}
      {modal === 'complaint' && <ComplaintModal order={order} onClose={() => setModal(null)} />}
    </article>
  );
}
