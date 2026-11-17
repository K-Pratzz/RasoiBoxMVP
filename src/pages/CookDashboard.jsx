import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, isSoldOut, money, STATUSES } from '../lib/utils';
import OrderCard from '../components/OrderCard';
import ProfileForm from '../components/ProfileForm';
import ImageUpload from '../components/ImageUpload';
import { ConfirmModal, Empty, Field, Modal, SmartImage, StatCard, StatusBadge, Tabs, VegDot } from '../components/ui';

function SellerForm({ initial, onDone }) {
  const { currentUser, saveSellerProfile, toast } = useApp();
  const [f, setF] = useState({ kitchenName: '', cuisine: '', bio: '', city: currentUser.city, locality: currentUser.locality, image: '', ...initial });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (f.kitchenName.trim().length < 3) er.kitchenName = 'Kitchen name must be at least 3 characters.';
    if (!f.cuisine.trim()) er.cuisine = 'Tell customers what you cook.';
    if (f.bio.trim().length < 15) er.bio = 'Write at least 15 characters about your kitchen.';
    if (!f.city.trim()) er.city = 'Required';
    if (!f.locality.trim()) er.locality = 'Required';
    setErrors(er);
    if (Object.keys(er).length) return;
    saveSellerProfile({ kitchenName: f.kitchenName.trim(), cuisine: f.cuisine.trim(), bio: f.bio.trim(), city: f.city.trim(), locality: f.locality.trim(), image: f.image });
    toast(initial ? 'Kitchen profile saved.' : 'Kitchen profile created and sent for approval.');
    onDone?.();
  };
  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4 p-5 sm:p-6" noValidate>
      <h2 className="text-xl font-bold text-brand-800">{initial ? 'Kitchen profile' : 'Create your seller profile'}</h2>
      <ImageUpload kind="cook" label="Profile photo" value={f.image} onChange={(image) => setF((s) => ({ ...s, image }))} />
      <Field label="Kitchen name" error={errors.kitchenName}><input className="input" value={f.kitchenName} onChange={set('kitchenName')} placeholder="e.g. Amma's Rasoi" /></Field>
      <Field label="Cuisine / speciality" error={errors.cuisine}><input className="input" value={f.cuisine} onChange={set('cuisine')} placeholder="e.g. Bengali home food" /></Field>
      <Field label="About your kitchen" error={errors.bio}><textarea className="input" rows={3} maxLength={250} value={f.bio} onChange={set('bio')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" error={errors.city}><input className="input" value={f.city} onChange={set('city')} /></Field>
        <Field label="Locality" error={errors.locality}><input className="input" value={f.locality} onChange={set('locality')} /></Field>
      </div>
      <button className="btn-primary">{initial ? 'Save kitchen profile' : 'Create profile'}</button>
    </form>
  );
}

function MealForm({ meal, onClose }) {
  const { addMeal, updateMeal, toast } = useApp();
  const [f, setF] = useState(() => ({
    name: '', description: '', category: 'Lunch', price: '', quantity: '', veg: true, available: true,
    pickup: true, delivery: false, deliveryCharge: '', image: '',
    ...(meal ? { ...meal, pickup: meal.fulfilment.pickup, delivery: meal.fulfilment.delivery, price: String(meal.price), quantity: String(meal.quantity), deliveryCharge: String(meal.deliveryCharge || '') } : {}),
  }));
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    const price = Number(f.price), qty = Number(f.quantity), dc = Number(f.deliveryCharge || 0);
    if (f.name.trim().length < 3) er.name = 'Meal name must be at least 3 characters.';
    if (f.description.trim().length < 10) er.description = 'Add a short description (10+ characters).';
    if (!(price >= 1 && price <= 5000)) er.price = 'Enter a price between ₹1 and ₹5000.';
    if (!(Number.isInteger(qty) && qty >= 0 && qty <= 500)) er.quantity = 'Enter a whole number between 0 and 500.';
    if (!f.pickup && !f.delivery) er.fulfilment = 'Choose pickup, delivery or both.';
    if (f.delivery && !(dc >= 0 && dc <= 500)) er.deliveryCharge = 'Enter a delivery charge between ₹0 and ₹500.';
    setErrors(er);
    if (Object.keys(er).length) return;
    const data = {
      name: f.name.trim(), description: f.description.trim(), category: f.category, price, quantity: qty,
      veg: f.veg, available: f.available, fulfilment: { pickup: f.pickup, delivery: f.delivery },
      deliveryCharge: f.delivery ? dc : 0, image: f.image,
    };
    if (meal) updateMeal(meal.id, data); else { const r = addMeal({ ...data, hiddenByAdmin: false }); if (!r.ok) return toast(r.error, 'error'); }
    toast(meal ? 'Meal updated.' : 'Meal added to your menu.');
    onClose();
  };

  return (
    <Modal title={meal ? 'Edit meal' : 'Add a meal'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <ImageUpload label="Food photo" value={f.image} onChange={(image) => setF((s) => ({ ...s, image }))} />
        <Field label="Meal name" error={errors.name}><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="Description" error={errors.description}><textarea className="input" rows={2} maxLength={200} value={f.description} onChange={set('description')} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category"><select className="input" value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Price (₹)" error={errors.price}><input className="input" type="number" min="1" value={f.price} onChange={set('price')} /></Field>
          <Field label="Quantity available" error={errors.quantity}><input className="input" type="number" min="0" value={f.quantity} onChange={set('quantity')} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset><legend className="label">Type</legend>
            <div className="flex gap-2">{[[true, 'Vegetarian'], [false, 'Non-vegetarian']].map(([v, l]) => (
              <label key={l} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold ${f.veg === v ? 'border-brand-800 bg-brand-800 text-cream' : 'border-brand-900/20 bg-white'}`}>
                <input type="radio" className="sr-only" name="veg" checked={f.veg === v} onChange={() => setF((s) => ({ ...s, veg: v }))} />{l}</label>
            ))}</div></fieldset>
          <fieldset><legend className="label">Fulfilment</legend>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={f.pickup} onChange={(e) => setF((s) => ({ ...s, pickup: e.target.checked }))} /> Pickup</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={f.delivery} onChange={(e) => setF((s) => ({ ...s, delivery: e.target.checked }))} /> Delivery</label>
            </div>
            {errors.fulfilment && <p className="mt-1 text-xs font-medium text-red-600">{errors.fulfilment}</p>}</fieldset>
        </div>
        {f.delivery && <Field label="Delivery charge (₹)" error={errors.deliveryCharge} hint="Delivery charges go entirely to you; commission applies to food price only."><input className="input max-w-[200px]" type="number" min="0" value={f.deliveryCharge} onChange={set('deliveryCharge')} /></Field>}
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={f.available} onChange={(e) => setF((s) => ({ ...s, available: e.target.checked }))} /> Available: visible to customers</label>
        {f.price > 0 && <p className="rounded-xl bg-brand-50 p-3 text-sm">At {money(Number(f.price))}: Rasoibox commission {money(Number(f.price) * 0.1)} · <b>you earn {money(Number(f.price) * 0.9)}</b> per meal.</p>}
        <div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary">{meal ? 'Save changes' : 'Add meal'}</button></div>
      </form>
    </Modal>
  );
}

function MyMeals({ seller }) {
  const { meals, updateMeal, deleteMeal, toast } = useApp();
  const [form, setForm] = useState(null); // null | 'new' | meal
  const [del, setDel] = useState(null);
  const mine = meals.filter((m) => m.sellerId === seller.id);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-brand-800">My meals ({mine.length})</h2><button className="btn-primary" onClick={() => setForm('new')}>+ Add meal</button></div>
      {seller.status !== 'approved' && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Your meals will become visible to customers once the admin approves your kitchen.</p>}
      {!mine.length ? <Empty icon="🍛" title="No meals yet">Add your first meal to start receiving orders.</Empty> : (
        <ul className="space-y-3">
          {mine.map((m) => (
            <li key={m.id} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <SmartImage src={m.image} alt={m.name} className="h-24 w-full rounded-xl sm:h-20 sm:w-28" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-bold"><VegDot veg={m.veg} /><span className="truncate">{m.name}</span></div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  <span className="chip bg-brand-50 text-brand-800">{m.category}</span>
                  <span className="chip bg-brand-50 text-brand-800">{money(m.price)} · {m.quantity} left</span>
                  {isSoldOut(m) && <span className="chip bg-red-100 text-red-700">Sold out</span>}
                  {!m.available && <span className="chip bg-gray-200 text-gray-700">Hidden</span>}
                  {m.hiddenByAdmin && <span className="chip bg-red-100 text-red-700">Hidden by admin</span>}
                  <span className="chip bg-sun/30 text-brand-900">{m.fulfilment.pickup ? 'Pickup' : ''}{m.fulfilment.pickup && m.fulfilment.delivery ? ' + ' : ''}{m.fulfilment.delivery ? `Delivery ${money(m.deliveryCharge)}` : ''}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-outline btn-sm" onClick={() => setForm(m)}>Edit</button>
                <button className="btn-outline btn-sm" onClick={() => { updateMeal(m.id, { soldOut: !m.soldOut }); toast(m.soldOut ? 'Back in stock.' : 'Marked as sold out.'); }}>{m.soldOut ? 'Back in stock' : 'Mark sold out'}</button>
                <button className="btn-outline btn-sm" onClick={() => { updateMeal(m.id, { available: !m.available }); toast(m.available ? 'Hidden from customers.' : 'Visible to customers.'); }}>{m.available ? 'Hide' : 'Show'}</button>
                <button className="btn-outline btn-sm text-red-700" onClick={() => setDel(m)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {form && <MealForm meal={form === 'new' ? null : form} onClose={() => setForm(null)} />}
      {del && <ConfirmModal danger title="Delete this meal?" message={`"${del.name}" will be removed from your menu and from customers' carts. Past orders keep their details.`} confirmLabel="Delete" onConfirm={() => { deleteMeal(del.id); toast('Meal deleted.'); }} onClose={() => setDel(null)} />}
    </div>
  );
}

export default function CookDashboard() {
  const { mySeller, orders } = useApp();
  const [tab, setTab] = useState('overview');
  const [orderFilter, setOrderFilter] = useState('All');

  if (!mySeller) return <div className="container-x py-8"><p className="mx-auto mb-5 max-w-2xl rounded-xl bg-sun/20 p-4 text-sm">Welcome! Create your seller profile first. After the admin approves it, your meals appear to customers.</p><SellerForm /></div>;

  const mine = orders.filter((o) => o.sellerId === mySeller.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const done = mine.filter((o) => o.status === 'Completed');
  const sum = (list, k) => list.reduce((s, o) => s + o[k], 0);
  const open = mine.filter((o) => !['Completed', 'Cancelled'].includes(o.status));
  const pending = mine.filter((o) => o.status === 'Pending').length;
  const shown = orderFilter === 'All' ? mine : mine.filter((o) => o.status === orderFilter);

  return (
    <div className="container-x py-8">
      <div className="flex flex-wrap items-center gap-4">
        <SmartImage src={mySeller.image} kind="cook" alt={mySeller.kitchenName} className="h-16 w-16 rounded-full" />
        <div><h1 className="text-3xl font-bold text-brand-800">{mySeller.kitchenName}</h1><p className="text-sm text-brand-900/70">{mySeller.cuisine} · {mySeller.locality}, {mySeller.city}</p></div>
        <span className={`chip ${mySeller.status === 'approved' ? 'bg-brand-100 text-brand-800' : mySeller.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>{mySeller.status === 'approved' ? 'Approved ✓' : mySeller.status === 'pending' ? 'Awaiting admin approval' : 'Rejected'}</span>
      </div>
      {mySeller.status === 'pending' && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Your kitchen is waiting for approval. You can add meals now. They become visible once approved. (Demo tip: log in as the demo admin to approve it.)</p>}
      {mySeller.status === 'rejected' && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">Your kitchen was not approved. Update your kitchen profile and save it to resubmit for review.</p>}

      <div className="mt-6"><Tabs active={tab} onChange={setTab} tabs={[['overview', 'Overview'], ['meals', 'My meals'], ['orders', 'Orders', pending], ['kitchen', 'Kitchen profile'], ['account', 'Account']]} /></div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard tone="bg-brand-800 [&_*]:!text-cream" label="Your earnings" value={money(sum(done, 'sellerEarnings'))} sub="From completed orders" />
            <StatCard label="Food sales" value={money(sum(done, 'subtotal'))} sub="Completed orders" />
            <StatCard label="Rasoibox commission (10%)" value={money(sum(done, 'commission'))} sub="Deducted from food sales" />
            <StatCard label="Expected earnings" value={money(sum(open, 'sellerEarnings'))} sub={`${open.length} order(s) in progress`} />
          </div>
          <div className="card p-5 text-sm text-brand-900/80">
            <h3 className="font-bold text-brand-800">How earnings work</h3>
            <p className="mt-1">On a ₹100 meal, Rasoibox keeps ₹10 (10%) and you earn ₹90. Delivery charges are all yours. Cash is collected by you directly from the customer. All figures here are demo data.</p>
          </div>
          {pending > 0 && <button className="btn-sun" onClick={() => setTab('orders')}>{pending} new order{pending > 1 ? 's' : ''} waiting →</button>}
        </div>
      )}
      {tab === 'meals' && <MyMeals seller={mySeller} />}
      {tab === 'orders' && (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">{['All', ...STATUSES].map((s) => <button key={s} onClick={() => setOrderFilter(s)} className={`chip px-3 py-1.5 ${orderFilter === s ? 'bg-brand-800 text-cream' : 'bg-white text-brand-800'}`}>{s}</button>)}</div>
          {shown.length ? <div className="grid gap-4 lg:grid-cols-2">{shown.map((o) => <OrderCard key={o.id} order={o} viewer="cook" />)}</div> : <Empty icon="📭" title="No orders here">Orders from customers will appear in this list.</Empty>}
        </div>
      )}
      {tab === 'kitchen' && <SellerForm initial={mySeller} />}
      {tab === 'account' && <ProfileForm />}
    </div>
  );
}
