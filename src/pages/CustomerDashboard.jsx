import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { money } from '../lib/utils';
import OrderCard from '../components/OrderCard';
import ProfileForm from '../components/ProfileForm';
import { Empty, StatCard, Tabs } from '../components/ui';

export default function CustomerDashboard() {
  const { currentUser, orders, cartCount } = useApp();
  const [tab, setTab] = useState('orders');
  const mine = orders.filter((o) => o.customerId === currentUser.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const active = mine.filter((o) => !['Completed', 'Cancelled'].includes(o.status));
  const spent = mine.filter((o) => o.status === 'Completed').reduce((s, o) => s + o.total, 0);

  return (
    <div className="container-x py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-bold text-brand-800">Hi, {currentUser.name.split(' ')[0]} 👋</h1><p className="text-brand-900/70">{currentUser.locality}, {currentUser.city}</p></div>
        <div className="flex gap-2"><Link to="/meals" className="btn-primary">Browse meals</Link><Link to="/cart" className="btn-outline">Cart ({cartCount})</Link></div>
      </div>
      <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total orders" value={mine.length} />
        <StatCard label="Active orders" value={active.length} />
        <StatCard label="Spent (completed)" value={money(spent)} />
      </div>
      <Tabs tabs={[['orders', 'Order history', active.length], ['profile', 'Profile']]} active={tab} onChange={setTab} />
      {tab === 'orders' && (mine.length ? <div className="grid gap-4 lg:grid-cols-2">{mine.map((o) => <OrderCard key={o.id} order={o} viewer="customer" />)}</div>
        : <Empty icon="🥘" title="No orders yet">Your orders will show up here.<div className="mt-3"><Link to="/meals" className="btn-primary">Find a meal</Link></div></Empty>)}
      {tab === 'profile' && <ProfileForm />}
    </div>
  );
}
