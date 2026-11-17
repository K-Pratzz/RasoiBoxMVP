import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../lib/utils';
import { MealCard } from '../components/MealCard';
import { Empty } from '../components/ui';
import { Link } from 'react-router-dom';

const PRICE = { any: [0, Infinity], u100: [0, 100], mid: [100, 200], o200: [200, Infinity] };

export default function Meals() {
  const { publicMeals, sellerById } = useApp();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || 'All';
  const price = params.get('price') || 'any';
  const diet = params.get('diet') || 'any';

  const set = (k, v, def) => {
    const next = new URLSearchParams(params);
    if (!v || v === def) next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    const [lo, hi] = PRICE[price] || PRICE.any;
    const term = q.trim().toLowerCase();
    return publicMeals.filter((m) => {
      if (category !== 'All' && m.category !== category) return false;
      if (m.price < lo || m.price > hi) return false;
      if (diet === 'veg' && !m.veg) return false;
      if (diet === 'nonveg' && m.veg) return false;
      if (term) {
        const hay = `${m.name} ${m.description} ${sellerById(m.sellerId)?.kitchenName || ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [publicMeals, q, category, price, diet, sellerById]);

  return (
    <div className="container-x py-8 sm:py-10">
      <h1 className="text-3xl font-bold text-brand-800 sm:text-4xl">Browse meals</h1>
      <p className="mt-1 text-brand-900/70">Fresh from home kitchens near you.</p>

      <div className="card mt-6 space-y-4 p-4">
        <input className="input" type="search" placeholder="Search by meal, cook or ingredient…" value={q} onChange={(e) => set('q', e.target.value, '')} aria-label="Search meals" />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
          {['All', ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => set('category', c, 'All')} aria-pressed={category === c}
              className={`chip px-4 py-2 text-sm ${category === c ? 'bg-brand-800 text-cream' : 'bg-brand-50 text-brand-800 hover:bg-brand-100'}`}>{c}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label><span className="label">Price</span>
            <select className="input" value={price} onChange={(e) => set('price', e.target.value, 'any')}>
              <option value="any">Any price</option><option value="u100">Under ₹100</option><option value="mid">₹100 – ₹200</option><option value="o200">Over ₹200</option>
            </select></label>
          <label><span className="label">Diet</span>
            <select className="input" value={diet} onChange={(e) => set('diet', e.target.value, 'any')}>
              <option value="any">Veg & non-veg</option><option value="veg">Vegetarian only</option><option value="nonveg">Non-vegetarian only</option>
            </select></label>
          <div className="flex items-end"><button className="btn-outline w-full" onClick={() => setParams({}, { replace: true })}>Clear filters</button></div>
        </div>
      </div>

      <p className="mt-5 text-sm text-brand-900/60" aria-live="polite">{results.length} meal{results.length === 1 ? '' : 's'} found</p>
      <div className="mt-3">
        {results.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{results.map((m) => <MealCard key={m.id} meal={m} />)}</div>
        ) : (
          <Empty icon="🔍" title="No meals match">Try a different search or clear the filters.{publicMeals.length === 0 && <div className="mt-3">No meals are saved in this browser. Use <b>Reset demo data</b> in the footer to load the samples, or <Link to="/register?type=cook" className="font-semibold underline">add your own as a cook</Link>.</div>}</Empty>
        )}
      </div>
    </div>
  );
}
