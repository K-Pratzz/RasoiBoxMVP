import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Meals from './pages/Meals';
import Cart from './pages/Cart';
import OrderConfirmation from './pages/OrderConfirmation';
import { Login, Register } from './pages/Auth';
import CustomerDashboard from './pages/CustomerDashboard';
import CookDashboard from './pages/CookDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

function Dashboard() {
  const { currentUser } = useApp();
  if (currentUser.role === 'admin') return <AdminDashboard />;
  if (currentUser.role === 'cook') return <CookDashboard />;
  return <CustomerDashboard />;
}

function GuestOnly({ children }) {
  const { currentUser } = useApp();
  return currentUser ? <Navigate to="/dashboard" replace /> : children;
}

// HashRouter keeps every route working on any static host and after a refresh.
export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="meals" element={<Meals />} />
            <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="register" element={<GuestOnly><Register /></GuestOnly>} />
            <Route path="cart" element={<ProtectedRoute roles={['customer']}><Cart /></ProtectedRoute>} />
            <Route path="order-confirmation/:ids" element={<ProtectedRoute roles={['customer']}><OrderConfirmation /></ProtectedRoute>} />
            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
