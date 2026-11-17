import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../lib/utils';
import { MealCard } from '../components/MealCard';
import { SmartImage } from '../components/ui';

const CAT_META = {
  Breakfast: { mealId: 'm1', blurb: 'Parathas, dosas & poha' },
  Lunch: { mealId: 'm6', blurb: 'Thalis, biryani & bowls' },
  Dinner: { mealId: 'm9', blurb: 'Comforting home curries' },
  Snacks: { mealId: 'm13', blurb: 'Samosas, vadas & kebabs' },
};

const STEPS = [
  ['🔎', 'Find a meal', 'Browse fresh menus from home cooks in your locality.'],
  ['🛒', 'Place an order', 'Pick pickup or delivery and pay cash. No online payment needed.'],
  ['👩‍🍳', 'Cook prepares it', 'The cook accepts your order and cooks it fresh.'],
  ['😋', 'Enjoy home food', 'Collect it nearby or have it delivered. Then leave a review.'],
];
const CUSTOMER_BENEFITS = [
  ['🏡', 'Real home-style taste', 'Meals made in home kitchens with everyday ingredients.'],
  ['💸', 'Affordable prices', 'Fair prices without restaurant markups.'],
  ['📍', 'Hyperlocal', 'Cooks from your own neighbourhood, so food stays fresh.'],
  ['⭐', 'Honest reviews', 'Rate your order and see what neighbours say.'],
];
const COOK_BENEFITS = [
  ['💰', 'Keep 90% of every sale', 'Rasoibox takes just a 10% commission. Delivery charges are yours.'],
  ['🕒', 'Cook on your schedule', 'Set quantity and availability each day. Mark sold out any time.'],
  ['📸', 'Show off your food', 'Upload photos from your phone to make your menu shine.'],
  ['📈', 'Simple dashboard', 'Accept orders, update status and see earnings in one place.'],
];

export default function Home() {
  const { publicMeals, mealById, currentUser } = useApp();
  const navigate = useNavigate();
  const loc = useLocation();
  const [q, setQ] = useState('');

  useEffect(() => {
    const id = loc.state?.scrollTo;
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, [loc.state]);

  const search = (e) => {
    e.preventDefault();
    navigate(`/meals${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };
  const heroImgs = ['m7', 'm2', 'm6'].map((id) => mealById(id)?.image);
  const featured = publicMeals.slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-900 text-cream">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sun/10 blur-2xl" aria-hidden="true" />
        <div className="container-x grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2">
          <div>
            <span className="chip bg-sun/20 text-sun">🌿 Hyperlocal home cooking</span>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">Home food, <span className="text-sun">closer to you.</span></h1>
            <p className="mt-4 max-w-lg text-cream/80">Order fresh, home-style meals from cooks in your neighbourhood. Pickup or delivery, pay in cash, no surprises.</p>
            <form onSubmit={search} className="mt-6 flex max-w-lg gap-2 rounded-full bg-white p-1.5 shadow-lift" role="search">
              <input className="min-w-0 flex-1 rounded-full bg-transparent px-4 text-sm text-brand-900 placeholder:text-brand-900/50 focus:outline-none" placeholder="Search biryani, dosa, thali…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search meals" />
              <button className="btn-primary">Search</button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {CATEGORIES.map((c) => <Link key={c} to={`/meals?category=${c}`} className="rounded-full border border-cream/30 px-3 py-1 hover:bg-white/10">{c}</Link>)}
            </div>
          </div>
          <div className="grid grid-cols-5 grid-rows-2 gap-3">
            <SmartImage src={heroImgs[0]} alt="Chicken biryani" className="col-span-3 row-span-2 h-full min-h-[260px] w-full rounded-3xl" />
            <SmartImage src={heroImgs[1]} alt="Masala dosa" className="col-span-2 h-full w-full rounded-3xl" />
            <SmartImage src={heroImgs[2]} alt="Veg thali" className="col-span-2 h-full w-full rounded-3xl" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section container-x" id="categories">
        <h2 className="text-3xl font-bold text-brand-800">What are you craving?</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link key={c} to={`/meals?category=${c}`} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl shadow-card sm:aspect-square">
              <SmartImage src={mealById(CAT_META[c].mealId)?.image} alt={c} className="h-full w-full transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/10 to-transparent" />
              <div className="absolute bottom-0 p-4 text-cream"><div className="font-display text-2xl font-bold">{c}</div><div className="text-xs text-cream/80">{CAT_META[c].blurb}</div></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Explore */}
      <section className="bg-cream-200 section" id="explore">
        <div className="container-x">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold text-brand-800">Explore meals near you</h2>
            <Link to="/meals" className="btn-outline btn-sm">See all meals →</Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((m) => <MealCard key={m.id} meal={m} />)}</div>
        </div>
      </section>

      {/* How it works */}
      <section className="section container-x" id="how">
        <div className="text-center"><h2 className="text-3xl font-bold text-brand-800">How Rasoibox works</h2><p className="mt-2 text-brand-900/70">From craving to doorstep in four simple steps.</p></div>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([icon, t, d], i) => (
            <li key={t} className="card relative p-5">
              <span className="absolute right-4 top-3 font-display text-4xl font-bold text-sun/50">{i + 1}</span>
              <div className="text-3xl">{icon}</div><h3 className="mt-3 text-lg font-bold text-brand-800">{t}</h3><p className="mt-1 text-sm text-brand-900/70">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Benefits */}
      <section className="section bg-brand-50" id="benefits">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          {[['For customers', CUSTOMER_BENEFITS], ['For home cooks', COOK_BENEFITS]].map(([title, list]) => (
            <div key={title}>
              <h2 className="text-2xl font-bold text-brand-800">{title}</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {list.map(([icon, t, d]) => (
                  <li key={t} className="card p-4"><div className="text-2xl">{icon}</div><div className="mt-2 font-bold text-brand-800">{t}</div><p className="mt-1 text-sm text-brand-900/70">{d}</p></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Become a seller */}
      <section className="section container-x" id="seller">
        <div className="relative overflow-hidden rounded-3xl bg-brand-800 p-8 text-cream sm:p-12">
          <div className="absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-sun/20" aria-hidden="true" />
          <div className="relative max-w-xl">
            <span className="chip bg-sun text-brand-900">Become a seller</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Turn your kitchen into a business.</h2>
            <p className="mt-3 text-cream/80">Love cooking? List your meals, set your own prices and quantities, and earn <b className="text-sun">₹90 on every ₹100</b> you sell.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={currentUser?.role === 'cook' ? '/dashboard' : '/register?type=cook'} className="btn-sun">{currentUser?.role === 'cook' ? 'Open my dashboard' : 'Start selling'}</Link>
              <Link to="/meals" className="btn border border-cream/40 text-cream hover:bg-white/10">See what others cook</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
