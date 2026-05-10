import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import BillingPage from './pages/billing/BillingPage'
import ProductsPage from './pages/products/ProductsPage'
import AddProductPage from './pages/products/AddProductPage'
import InventoryPage from './pages/inventory/InventoryPage'
import CustomersPage from './pages/customers/CustomersPage'
import BillsPage from './pages/bills/BillsPage'
import AIPredictionPage from './pages/ai/AIPredictionPage'
import StaffPage from './pages/staff/StaffPage'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import { getRoleHomePath } from './utils/roleUtils'

function RoleHomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={getRoleHomePath(user?.role)} replace />
}

function LoginEntry() {
  const { user } = useAuth()
  return user ? <RoleHomeRedirect /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginEntry />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<RoleHomeRedirect />} />

              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/ai" element={<AIPredictionPage />} />
                <Route path="/staff" element={<StaffPage />} />
              </Route>

              <Route element={<ProtectedRoute roles={['admin', 'cashier', 'staff']} />}>
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/bills" element={<BillsPage />} />
              </Route>

              <Route element={<ProtectedRoute roles={['admin', 'staff']} />}>
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/add" element={<AddProductPage />} />
                <Route path="/products/edit/:id" element={<AddProductPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
              </Route>

              <Route element={<ProtectedRoute roles={['customer']} />}>
                <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  )
}
