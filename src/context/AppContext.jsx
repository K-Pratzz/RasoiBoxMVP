import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import seedUsers from '../data/users.json';
import seedSellers from '../data/sellers.json';
import seedMeals from '../data/meals.json';
import seedOrders from '../data/orders.json';
import seedReviews from '../data/reviews.json';
import seedComplaints from '../data/complaints.json';
import {
  PREFIX, read, write, getSessionUserId, setSessionUserId, clearSession, clearAllGharseData,
} from '../lib/storage';
import { nextActions, splitAmount, uid, isOrderable, validators } from '../lib/utils';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// JSON files are only the *initial* data. After first load, localStorage is the source of truth.
function usePersisted(key, seed, recoverIfEmpty = false) {
  const [value, setValue] = useState(() => {
    const stored = read(key, seed);
    // Safety net: if saved core data is somehow an empty list, fall back to the sample data.
    return recoverIfEmpty && Array.isArray(stored) && stored.length === 0 ? seed : stored;
  });
  useEffect(() => {
    write(key, value);
  }, [key, value]);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === PREFIX + key && e.newValue) {
        try { setValue(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);
  return [value, setValue];
}

const fail = (error) => ({ ok: false, error });

export function AppProvider({ children }) {
  const [users, setUsers] = usePersisted('users', seedUsers, true);
  const [sellers, setSellers] = usePersisted('sellers', seedSellers, true);
  const [meals, setMeals] = usePersisted('meals', seedMeals, true);
  const [carts, setCarts] = usePersisted('carts', {});
  const [orders, setOrders] = usePersisted('orders', seedOrders);
  const [reviews, setReviews] = usePersisted('reviews', seedReviews);
  const [complaints, setComplaints] = usePersisted('complaints', seedComplaints);
  const [sessionId, setSessionId] = useState(() => getSessionUserId());
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'ok') => {
    const id = uid('t');
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  useEffect(() => {
    const h = () => toast('Browser storage is full. Remove some photos or reset demo data, then try again.', 'error');
    window.addEventListener('rasoibox:storage-error', h);
    return () => window.removeEventListener('rasoibox:storage-error', h);
  }, [toast]);

  const currentUser = useMemo(() => users.find((u) => u.id === sessionId) || null, [users, sessionId]);
  const mySeller = useMemo(() => (currentUser ? sellers.find((s) => s.userId === currentUser.id) || null : null), [sellers, currentUser]);
  const sellerById = useCallback((id) => sellers.find((s) => s.id === id), [sellers]);
  const mealById = useCallback((id) => meals.find((m) => m.id === id), [meals]);

  const sellerRating = useCallback((sid) => {
    const r = reviews.filter((x) => x.sellerId === sid);
    return { count: r.length, avg: r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0 };
  }, [reviews]);

  // Meals customers may see: approved cook, not hidden by admin, cook has not paused the listing.
  const publicMeals = useMemo(
    () => meals.filter((m) => m.available && !m.hiddenByAdmin && sellers.find((s) => s.id === m.sellerId)?.status === 'approved'),
    [meals, sellers],
  );

  // ---------- Auth (DEMO ONLY: plain localStorage, not secure) ----------
  const register = useCallback((f) => {
    const email = f.email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === email)) return fail('An account with this email already exists.');
    const user = {
      id: uid('u'), role: f.role, name: f.name.trim(), email, phone: f.phone.trim(),
      password: f.password, city: f.city.trim(), locality: f.locality.trim(), createdAt: new Date().toISOString(),
    };
    setUsers((u) => [...u, user]);
    setSessionUserId(user.id, true);
    setSessionId(user.id);
    return { ok: true, user };
  }, [users, setUsers]);

  const login = useCallback((emailRaw, password, remember = true) => {
    const user = users.find((u) => u.email.toLowerCase() === emailRaw.trim().toLowerCase());
    if (!user || user.password !== password) return fail('Incorrect email or password.');
    setSessionUserId(user.id, remember);
    setSessionId(user.id);
    return { ok: true, user };
  }, [users]);

  const logout = useCallback(() => {
    clearSession();
    setSessionId(null);
  }, []);

  const updateProfile = useCallback((patch) => {
    if (!currentUser) return fail('Not signed in.');
    setUsers((list) => list.map((u) => (u.id === currentUser.id ? { ...u, ...patch } : u)));
    return { ok: true };
  }, [currentUser, setUsers]);

  // ---------- Cook: seller profile & meals ----------
  const saveSellerProfile = useCallback((data) => {
    if (!currentUser) return fail('Not signed in.');
    if (mySeller) {
      setSellers((l) => l.map((s) => (s.id === mySeller.id ? { ...s, ...data, status: s.status === 'rejected' ? 'pending' : s.status } : s)));
    } else {
      setSellers((l) => [...l, { id: uid('s'), userId: currentUser.id, status: 'pending', createdAt: new Date().toISOString(), ...data }]);
    }
    return { ok: true };
  }, [currentUser, mySeller, setSellers]);

  const addMeal = useCallback((data) => {
    if (!mySeller) return fail('Create your kitchen profile first.');
    setMeals((l) => [{ id: uid('m'), sellerId: mySeller.id, soldOut: false, hiddenByAdmin: false, createdAt: new Date().toISOString(), ...data }, ...l]);
    return { ok: true };
  }, [mySeller, setMeals]);

  const updateMeal = useCallback((id, patch) => setMeals((l) => l.map((m) => (m.id === id ? { ...m, ...patch } : m))), [setMeals]);

  const deleteMeal = useCallback((id) => {
    setMeals((l) => l.filter((m) => m.id !== id));
    setCarts((c) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.filter((i) => i.mealId !== id)])));
  }, [setMeals, setCarts]);

  // ---------- Cart ----------
  const myCart = useMemo(() => (currentUser ? carts[currentUser.id] || [] : []), [carts, currentUser]);

  const cartLines = useMemo(
    () => myCart.map((i) => ({ ...i, meal: meals.find((m) => m.id === i.mealId) })).filter((l) => l.meal),
    [myCart, meals],
  );
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);

  const setCart = useCallback((fn) => {
    if (!currentUser) return;
    setCarts((c) => ({ ...c, [currentUser.id]: fn(c[currentUser.id] || []) }));
  }, [currentUser, setCarts]);

  const addToCart = useCallback((mealId, qty = 1) => {
    const meal = meals.find((m) => m.id === mealId);
    if (!currentUser || currentUser.role !== 'customer') return fail('Please sign in as a customer to order.');
    if (!meal || !isOrderable(meal)) return fail('This meal is not available right now.');
    const existing = myCart.find((i) => i.mealId === mealId)?.qty || 0;
    if (existing + qty > meal.quantity) {
      return fail(`Only ${meal.quantity} available${existing ? ` (you already have ${existing} in your cart)` : ''}.`);
    }
    setCart((list) => (list.some((i) => i.mealId === mealId)
      ? list.map((i) => (i.mealId === mealId ? { ...i, qty: i.qty + qty } : i))
      : [...list, { mealId, qty }]));
    return { ok: true };
  }, [meals, currentUser, myCart, setCart]);

  const setCartQty = useCallback((mealId, qty) => {
    const meal = meals.find((m) => m.id === mealId);
    if (qty < 1) return setCart((l) => l.filter((i) => i.mealId !== mealId));
    if (meal && qty > meal.quantity) return fail(`Only ${meal.quantity} available.`);
    setCart((l) => l.map((i) => (i.mealId === mealId ? { ...i, qty } : i)));
    return { ok: true };
  }, [meals, setCart]);

  const removeFromCart = useCallback((mealId) => setCart((l) => l.filter((i) => i.mealId !== mealId)), [setCart]);

  // ---------- Orders ----------
  const placeOrders = useCallback(({ fulfilments, address, phone, note }) => {
    if (!currentUser || currentUser.role !== 'customer') return fail('Please sign in as a customer.');
    if (!cartLines.length) return fail('Your cart is empty.');
    for (const l of cartLines) {
      if (!isOrderable(l.meal) || sellers.find((s) => s.id === l.meal.sellerId)?.status !== 'approved') return fail(`"${l.meal.name}" is no longer available. Please remove it.`);
      if (l.qty > l.meal.quantity) return fail(`Only ${l.meal.quantity} of "${l.meal.name}" left.`);
    }
    const groups = {};
    cartLines.forEach((l) => { (groups[l.meal.sellerId] ||= []).push(l); });
    let n = orders.reduce((mx, o) => Math.max(mx, parseInt(String(o.id).replace(/\D/g, ''), 10) || 0), 1000);
    const now = new Date().toISOString();
    for (const [sid, lines] of Object.entries(groups)) {
      const ful = fulfilments[sid] || 'pickup';
      if (lines.some((l) => !l.meal.fulfilment[ful])) return fail(`Some items from one cook don't support ${ful}.`);
    }
    const created = Object.entries(groups).map(([sid, lines]) => {
      const ful = fulfilments[sid] || 'pickup';
      const subtotal = lines.reduce((s, l) => s + l.meal.price * l.qty, 0);
      const deliveryCharge = ful === 'delivery' ? Math.max(...lines.map((l) => l.meal.deliveryCharge || 0)) : 0;
      return {
        id: `RB-${++n}`, customerId: currentUser.id, customerName: currentUser.name, customerPhone: phone,
        sellerId: sid,
        items: lines.map((l) => ({ mealId: l.meal.id, name: l.meal.name, price: l.meal.price, qty: l.qty, image: l.meal.image })),
        subtotal, deliveryCharge, ...splitAmount(subtotal, deliveryCharge), total: subtotal + deliveryCharge,
        fulfilment: ful, address: ful === 'delivery' ? address : '', note,
        payment: ful === 'delivery' ? 'Cash on Delivery' : 'Cash on Pickup',
        status: 'Pending', createdAt: now, history: [{ status: 'Pending', at: now }],
      };
    });
    setOrders((l) => [...created, ...l]);
    setMeals((l) => l.map((m) => {
      const line = cartLines.find((x) => x.meal.id === m.id);
      return line ? { ...m, quantity: m.quantity - line.qty } : m;
    }));
    setCarts((c) => ({ ...c, [currentUser.id]: [] }));
    return { ok: true, orderIds: created.map((o) => o.id) };
  }, [currentUser, cartLines, sellers, orders, setOrders, setMeals, setCarts]);

  const changeOrderStatus = useCallback((orderId, status) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return fail('Order not found.');
    if (!nextActions(order).some((a) => a.status === status)) return fail(`Cannot move this order from ${order.status} to ${status}.`);
    const at = new Date().toISOString();
    setOrders((l) => l.map((o) => (o.id === orderId ? { ...o, status, history: [...(o.history || []), { status, at }] } : o)));
    if (status === 'Cancelled') {
      setMeals((l) => l.map((m) => {
        const it = order.items.find((i) => i.mealId === m.id);
        return it ? { ...m, quantity: m.quantity + it.qty } : m;
      }));
    }
    return { ok: true };
  }, [orders, setOrders, setMeals]);

  // ---------- Reviews & complaints ----------
  const addReview = useCallback((order, rating, comment) => {
    if (reviews.some((r) => r.orderId === order.id)) return fail('You already reviewed this order.');
    setReviews((l) => [...l, { id: uid('r'), orderId: order.id, sellerId: order.sellerId, customerId: order.customerId, customerName: order.customerName, rating, comment: comment.trim(), createdAt: new Date().toISOString() }]);
    return { ok: true };
  }, [reviews, setReviews]);

  const addComplaint = useCallback((order, subject, message) => {
    setComplaints((l) => [...l, { id: uid('c'), orderId: order.id, customerId: order.customerId, customerName: order.customerName, sellerId: order.sellerId, subject: subject.trim(), message: message.trim(), status: 'open', response: '', createdAt: new Date().toISOString() }]);
    return { ok: true };
  }, [setComplaints]);

  const resolveComplaint = useCallback((id, response) => {
    setComplaints((l) => l.map((c) => (c.id === id ? { ...c, status: 'resolved', response: response.trim() } : c)));
  }, [setComplaints]);

  // ---------- Admin (demo only) ----------
  const setSellerStatus = useCallback((id, status) => setSellers((l) => l.map((s) => (s.id === id ? { ...s, status } : s))), [setSellers]);

  // ---------- Reset ----------
  const resetDemo = useCallback(() => {
    clearAllGharseData();
    setUsers(seedUsers); setSellers(seedSellers); setMeals(seedMeals); setCarts({});
    setOrders(seedOrders); setReviews(seedReviews); setComplaints(seedComplaints);
    setSessionId(null);
  }, [setUsers, setSellers, setMeals, setCarts, setOrders, setReviews, setComplaints]);

  const value = {
    users, sellers, meals, orders, reviews, complaints, currentUser, mySeller, publicMeals,
    sellerById, mealById, sellerRating, cartLines, cartCount, toasts, toast,
    register, login, logout, updateProfile, saveSellerProfile, addMeal, updateMeal, deleteMeal,
    addToCart, setCartQty, removeFromCart, placeOrders, changeOrderStatus,
    addReview, addComplaint, resolveComplaint, setSellerStatus, resetDemo, validators,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
