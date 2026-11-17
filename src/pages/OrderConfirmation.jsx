import { Link, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import OrderCard from '../components/OrderCard';
import { Empty } from '../components/ui';

export default function OrderConfirmation() {
  const { ids } = useParams();
  const { orders, currentUser } = useApp();
  const mine = ids.split(',').map((id) => orders.find((o) => o.id === id)).filter((o) => o && o.customerId === currentUser.id);
  if (!mine.length) return <div className="container-x py-12"><Empty icon="🤔" title="Order not found"><Link to="/dashboard" className="btn-primary mt-3">Go to my orders</Link></Empty></div>;
  return (
    <div className="container-x max-w-3xl py-10">
      <div className="rounded-3xl bg-brand-800 p-8 text-center text-cream">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-2 text-3xl font-bold">Order placed!</h1>
        <p className="mt-1 text-cream/80">The cook will accept it shortly. You'll pay in cash. Track progress in your order history.</p>
      </div>
      <div className="mt-6 space-y-4">{mine.map((o) => <OrderCard key={o.id} order={o} viewer="customer" />)}</div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/dashboard" className="btn-primary">View order history</Link>
        <Link to="/meals" className="btn-outline">Keep browsing</Link>
      </div>
    </div>
  );
}
