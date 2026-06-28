import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import AdminLogin from './pages/AdminLogin'
import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Users from './pages/Users'
import Drivers from './pages/Drivers'
import Support from './pages/Support'
import SupportTickets from './pages/SupportTickets'
import PaymentMethods from './pages/PaymentMethods'
import DeliveryCities from './pages/DeliveryCities'
import Settings from './pages/Settings'
import Reports from './pages/Reports'
import MarketingTools from './pages/MarketingTools'
import Promotions from './pages/Promotions'
import FirstOrderDiscount from './pages/FirstOrderDiscount'
import Reviews from './pages/Reviews'
import DashboardUsers from './pages/DashboardUsers'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartSidebar from './components/CartSidebar'
import ScrollToTop from './components/ScrollToTop'
import PixelTracker from './components/PixelTracker'

import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import StoreLogin from './pages/StoreLogin'
import Register from './pages/Register'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import StoreOrders from './pages/StoreOrders'
import Profile from './pages/Profile'

function AdminProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">جاري التحميل...</div>
  if (!user) return <Navigate to="/admin/login" replace />
  if (user.role !== 'admin') return <div className="error">غير مصرح بالدخول</div>
  return children
}

function PageWrapper({ children }) {
  const location = useLocation()
  return <div className="page-transition" key={location.pathname}>{children}</div>
}

function AppLayout() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const [cartOpen, setCartOpen] = useState(false)

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="users" element={<Users />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="support" element={<Support />} />
          <Route path="support-tickets" element={<SupportTickets />} />
          <Route path="reports" element={<Reports />} />
          <Route path="payment-methods" element={<PaymentMethods />} />
          <Route path="delivery-cities" element={<DeliveryCities />} />
          <Route path="settings" element={<Settings />} />
          <Route path="marketing-tools" element={<MarketingTools />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="first-order-discount" element={<FirstOrderDiscount />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="dashboard-users" element={<DashboardUsers />} />
        </Route>
      </Routes>
    )
  }

  return (
    <>
      <PixelTracker />
      <Navbar onCartToggle={() => setCartOpen(true)} />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <ScrollToTop />
      <PageWrapper>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<StoreLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<StoreOrders />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </PageWrapper>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  )
}
