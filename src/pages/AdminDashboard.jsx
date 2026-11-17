import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { fmtDate, isSoldOut, money, STATUSES } from '../lib/utils';
import OrderCard from '../components/OrderCard';
import { ConfirmModal, Empty, SmartImage, StatCard, Tabs } from '../components/ui';

const Table = ({ head, children }) => (
  <div className="card overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
    <thead className="bg-brand-50 text-xs uppercase tracking-wide text-brand-800"><tr>{head.map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
    <tbody className="divide-y divide-brand-900/10">{children}</tbody></table></div>
);

export default function AdminDashboard() {
  const { users, sellers, meals, orders, complaints, resolveComplaint, setSellerStatus, updateMeal, deleteMeal, sellerById, toast } = useApp();
  const [tab, setTab] = useState('overview');
  const [filter, setFilter] = useState('All');
  const [del, setDel] = useState(null);
  const [replies, setReplies] = useState({});

  const customers = users.filter((u) => u.role === 'customer');
  const done = orders.filter((o) => o.status === 'Completed');
  const pendingSellers = sellers.filter((s) => s.status === 'pending').length;
  const openComplaints = complaints.filter((c) => c.status === 'open').length;
  const shown = (filter === 'All' ? orders : orders.filter((o) => o.status === filter)).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-bold text-brand-800">Admin dashboard</h1>
      <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">🔒 <b>Demo-only admin.</b> This role is checked in your browser only, so anyone could edit localStorage to access it. It is not real security. A production app needs a server to enforce admin permissions.</p>
      <div className="mt-6"><Tabs active={tab} onChange={setTab} tabs={[['overview', 'Overview'], ['customers', 'Customers'], ['cooks', 'Cooks', pendingSellers], ['listings', 'Listings'], ['orders', 'Orders'], ['complaints', 'Complaints', openComplaints]]} /></div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total orders" value={orders.length} sub={`${done.length} completed`} />
          <StatCard label="Total food sales" value={money(done.reduce((s, o) => s + o.subtotal, 0))} sub="Completed orders" />
          <StatCard tone="bg-brand-800 [&_*]:!text-cream" label="Platform commission" value={money(done.reduce((s, o) => s + o.commission, 0))} sub="10% of food sales" />
          <StatCard label="Open complaints" value={openComplaints} />
          <StatCard label="Customers" value={customers.length} />
          <StatCard label="Cooks" value={sellers.length} sub={`${pendingSellers} awaiting approval`} />
          <StatCard label="Food listings" value={meals.length} />
          <StatCard label="Active orders" value={orders.filter((o) => !['Completed', 'Cancelled'].includes(o.status)).length} />
        </div>
      )}

      {tab === 'customers' && <Table head={['Name', 'Email', 'Phone', 'Location', 'Joined', 'Orders']}>
        {customers.map((u) => <tr key={u.id}><td className="px-4 py-3 font-semibold">{u.name}</td><td className="px-4 py-3">{u.email}</td><td className="px-4 py-3">{u.phone}</td><td className="px-4 py-3">{u.locality}, {u.city}</td><td className="px-4 py-3">{fmtDate(u.createdAt)}</td><td className="px-4 py-3">{orders.filter((o) => o.customerId === u.id).length}</td></tr>)}
      </Table>}

      {tab === 'cooks' && (sellers.length ? <Table head={['Kitchen', 'Cook', 'Location', 'Meals', 'Status', 'Actions']}>
        {sellers.map((s) => {
          const u = users.find((x) => x.id === s.userId);
          return <tr key={s.id}>
            <td className="px-4 py-3"><div className="flex items-center gap-2"><SmartImage src={s.image} kind="cook" alt="" className="h-9 w-9 rounded-full" /><b>{s.kitchenName}</b></div></td>
            <td className="px-4 py-3">{u?.name}<div className="text-xs text-brand-900/60">{u?.email}</div></td>
            <td className="px-4 py-3">{s.locality}, {s.city}</td>
            <td className="px-4 py-3">{meals.filter((m) => m.sellerId === s.id).length}</td>
            <td className="px-4 py-3"><span className={`chip ${s.status === 'approved' ? 'bg-brand-100 text-brand-800' : s.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>{s.status}</span></td>
            <td className="px-4 py-3"><div className="flex gap-2">
              {s.status !== 'approved' && <button className="btn-primary btn-sm" onClick={() => { setSellerStatus(s.id, 'approved'); toast(`${s.kitchenName} approved.`); }}>Approve</button>}
              {s.status !== 'rejected' && <button className="btn-outline btn-sm text-red-700" onClick={() => { setSellerStatus(s.id, 'rejected'); toast(`${s.kitchenName} rejected.`); }}>Reject</button>}
            </div></td></tr>;
        })}</Table> : <Empty title="No cooks yet">Cooks who register will appear here.</Empty>)}

      {tab === 'listings' && <Table head={['Meal', 'Cook', 'Price', 'Stock', 'Status', 'Actions']}>
        {meals.map((m) => <tr key={m.id}>
          <td className="px-4 py-3"><div className="flex items-center gap-2"><SmartImage src={m.image} alt="" className="h-10 w-12 rounded-lg" /><b>{m.name}</b></div></td>
          <td className="px-4 py-3">{sellerById(m.sellerId)?.kitchenName}</td><td className="px-4 py-3">{money(m.price)}</td>
          <td className="px-4 py-3">{m.quantity}</td>
          <td className="px-4 py-3 text-xs">{m.hiddenByAdmin ? 'Hidden by admin' : !m.available ? 'Hidden by cook' : isSoldOut(m) ? 'Sold out' : 'Live'}</td>
          <td className="px-4 py-3"><div className="flex gap-2">
            <button className="btn-outline btn-sm" onClick={() => { updateMeal(m.id, { hiddenByAdmin: !m.hiddenByAdmin }); toast(m.hiddenByAdmin ? 'Listing restored.' : 'Listing hidden.'); }}>{m.hiddenByAdmin ? 'Unhide' : 'Hide'}</button>
            <button className="btn-outline btn-sm text-red-700" onClick={() => setDel(m)}>Delete</button></div></td></tr>)}
      </Table>}

      {tab === 'orders' && <div>
        <div className="mb-4 flex flex-wrap gap-2">{['All', ...STATUSES].map((s) => <button key={s} onClick={() => setFilter(s)} className={`chip px-3 py-1.5 ${filter === s ? 'bg-brand-800 text-cream' : 'bg-white text-brand-800'}`}>{s}</button>)}</div>
        {shown.length ? <div className="grid gap-4 lg:grid-cols-2">{shown.map((o) => <OrderCard key={o.id} order={o} viewer="admin" />)}</div> : <Empty icon="📭" title="No orders">Nothing matches this filter.</Empty>}
      </div>}

      {tab === 'complaints' && (complaints.length ? <ul className="space-y-3">
        {complaints.slice().reverse().map((c) => <li key={c.id} className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><b>{c.subject}</b><span className={`chip ${c.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'}`}>{c.status}</span></div>
          <div className="text-xs text-brand-900/60">Order {c.orderId} · {c.customerName} · against {sellerById(c.sellerId)?.kitchenName} · {fmtDate(c.createdAt)}</div>
          <p className="mt-2 text-sm">{c.message}</p>
          {c.status === 'resolved' ? <p className="mt-2 rounded-lg bg-brand-50 p-2 text-sm"><b>Resolution:</b> {c.response || '—'}</p> : (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input className="input" placeholder="Write a resolution note…" value={replies[c.id] || ''} onChange={(e) => setReplies({ ...replies, [c.id]: e.target.value })} aria-label="Resolution note" />
              <button className="btn-primary shrink-0" onClick={() => { resolveComplaint(c.id, replies[c.id] || 'Resolved by admin.'); toast('Complaint resolved.'); }}>Mark resolved</button>
            </div>)}
        </li>)}</ul> : <Empty icon="🙌" title="No complaints">Great news. Customers haven't reported any issues.</Empty>)}

      {del && <ConfirmModal danger title="Delete listing?" message={`Permanently remove "${del.name}"?`} confirmLabel="Delete" onConfirm={() => { deleteMeal(del.id); toast('Listing deleted.'); }} onClose={() => setDel(null)} />}
    </div>
  );
}
