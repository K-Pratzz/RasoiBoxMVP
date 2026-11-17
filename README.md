# Rasoibox — Home food, closer to you

A **frontend-only** working demo of the Rasoibox home-cook marketplace.
React + Vite + Tailwind CSS + plain JavaScript. **No backend, database, Firebase, paid API or hosting needed.**

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
# or
npm run build && npm run preview
```
Requires Node 18+. The `dist/` folder after `npm run build` can be hosted on any static host (routes use `#/…` so refresh always works).

## Demo accounts (also shown on the Login page)

| Role | Email | Password |
|---|---|---|
| Customer | aarav@demo.com | demo123 |
| Home cook (approved) | sunita@demo.com | demo123 |
| Home cook (pending approval) | meera@demo.com | demo123 |
| Admin (demo only) | admin@rasoibox.demo | admin123 |

## Try the full order flow
1. Log in as **Aarav** → Browse meals → Add to cart → Cart → choose Pickup/Delivery → Place order.
2. Log out, log in as **Sunita** (or the cook whose meal you ordered) → Orders → Accept → Start preparing → Ready/Out for delivery → Mark completed.
3. Log in as Aarav again → Order history shows the new status; leave a review or report an issue.
4. Log in as **Admin** → approve/reject cooks, hide/delete listings, resolve complaints, see sales & commission.
5. Register a new **Home cook** → create kitchen profile → add meals with a photo upload → admin approves → meals go live.

## How data is stored
- `src/data/*.json` (users, sellers, meals, orders, reviews, complaints) are **initial sample data only**. They are loaded the first time you open the site.
- After that, **everything lives in the browser's localStorage** (keys prefixed `rasoibox_`). Data survives refresh and reopening in the same browser. A browser can't write back to JSON files on a website, and this app doesn't pretend to.
- Different browsers/devices/private windows each have their own separate data.
- **Reset demo data**: footer → "Reset demo data" (erases everything and restores the samples).

## Honest limitations
- **Not secure.** Login is a localStorage demo; passwords are stored as plain text in your browser. Use fake details. The admin role is only checked in the browser; anyone can bypass it via dev tools. Real security needs a server.
- **Storage limit ~5 MB.** Uploaded photos are resized to ≤800px and JPEG-compressed (~150 KB), so roughly 25–30 photos fit. If storage fills up, the app shows an error instead of failing silently.
- **Photos** for sample meals are hot-linked from Unsplash and need internet. If one fails to load, a built-in fallback image is shown. Replace the URLs in `src/data/*.json` with your own images if you like.
- Payments: Cash on Pickup / Cash on Delivery only. No online payments.

## Business rules
- Commission: **10% of food value**. ₹100 meal → ₹10 commission, ₹90 to the cook. Delivery charge goes fully to the cook. Shown on every order, the cook dashboard and the admin dashboard. Earnings/commission totals count **completed** orders.
- Quantity is reserved when an order is placed, so customers can't order more than is available. Cancelling or rejecting returns the stock.
- A cart with meals from several cooks is split into one order per cook.
- Cooks must be approved by admin before their meals are visible to customers.
- Statuses: Pending → Accepted → Preparing → Ready for Pickup (pickup) / Out for Delivery (delivery) → Completed; or Cancelled.

## Project structure
```
src/
  data/        users.json, sellers.json, meals.json, orders.json, reviews.json, complaints.json
  lib/         storage.js (localStorage wrapper), utils.js (money, commission, status flow, image compression)
  context/     AppContext.jsx (all state + actions, persisted to localStorage)
  components/  Layout (navbar/footer), ui, MealCard, OrderCard, ProfileForm, ImageUpload, ProtectedRoute
  pages/       Home, Meals, Cart, OrderConfirmation, Auth (Login/Register),
               CustomerDashboard, CookDashboard, AdminDashboard, NotFound
```
