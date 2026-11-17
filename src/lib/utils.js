export const COMMISSION_RATE = 0.1;
export const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
export const STATUSES = ['Pending', 'Accepted', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Completed', 'Cancelled'];

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// 10% commission on food value. Delivery charge goes entirely to the cook.
export function splitAmount(subtotal, deliveryCharge = 0) {
  const commission = Math.round(subtotal * COMMISSION_RATE * 100) / 100;
  return { commission, sellerEarnings: Math.round((subtotal - commission + deliveryCharge) * 100) / 100 };
}

export const isSoldOut = (m) => m.soldOut || m.quantity <= 0;
export const isOrderable = (m) => m.available && !m.hiddenByAdmin && !isSoldOut(m);

// Valid next steps for an order. Pickup orders skip "Out for Delivery"; delivery orders skip "Ready for Pickup".
export function nextActions(order) {
  const cancel = { status: 'Cancelled', label: 'Cancel order', danger: true };
  switch (order.status) {
    case 'Pending':
      return [{ status: 'Accepted', label: 'Accept' }, { status: 'Cancelled', label: 'Reject', danger: true }];
    case 'Accepted':
      return [{ status: 'Preparing', label: 'Start preparing' }, cancel];
    case 'Preparing':
      return [
        order.fulfilment === 'delivery'
          ? { status: 'Out for Delivery', label: 'Out for delivery' }
          : { status: 'Ready for Pickup', label: 'Ready for pickup' },
        cancel,
      ];
    case 'Ready for Pickup':
    case 'Out for Delivery':
      return [{ status: 'Completed', label: 'Mark completed' }, cancel];
    default:
      return [];
  }
}

export const statusTone = {
  Pending: 'bg-amber-100 text-amber-800',
  Accepted: 'bg-sky-100 text-sky-800',
  Preparing: 'bg-orange-100 text-orange-800',
  'Ready for Pickup': 'bg-lime-100 text-lime-800',
  'Out for Delivery': 'bg-indigo-100 text-indigo-800',
  Completed: 'bg-brand-100 text-brand-800',
  Cancelled: 'bg-red-100 text-red-700',
};

// Resize + re-encode an uploaded image so it fits comfortably in localStorage (~5 MB total).
export function compressImage(file, { maxDim = 800, targetBytes = 180_000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Please choose an image file (JPG, PNG or WebP).'));
    if (file.size > 10 * 1024 * 1024) return reject(new Error('That image is over 10 MB. Please pick a smaller one.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let dim = maxDim;
      let quality = 0.78;
      let result = '';
      for (let i = 0; i < 6; i++) {
        const scale = Math.min(1, dim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        result = canvas.toDataURL('image/jpeg', quality);
        if (result.length * 0.75 <= targetBytes) break;
        dim = Math.round(dim * 0.8);
        quality = Math.max(0.5, quality - 0.08);
      }
      resolve(result);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

export const validators = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  phone: (v) => /^[6-9]\d{9}$/.test(v.trim()),
};
