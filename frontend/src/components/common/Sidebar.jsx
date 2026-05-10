import { NavLink, useNavigate } from 'react-router-dom'
import {
  Brain,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  ShoppingCart,
  UserCog,
  Users,
  Warehouse,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { getRoleLabel } from '../../utils/roleUtils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Executive Dashboard', roles: ['admin'] },
  { to: '/billing', icon: ShoppingCart, label: 'Checkout Counter', roles: ['admin', 'cashier', 'staff'] },
  { to: '/products', icon: Package, label: 'Product Catalog', roles: ['admin', 'staff'] },
  { to: '/inventory', icon: Warehouse, label: 'Inventory Control', roles: ['admin', 'staff'] },
  { to: '/customers', icon: Users, label: 'Customer Desk', roles: ['admin', 'cashier', 'staff'] },
  { to: '/bills', icon: FileText, label: 'Invoices', roles: ['admin', 'cashier', 'staff'] },
  { to: '/customer/dashboard', icon: LayoutDashboard, label: 'My Purchases', roles: ['customer'] },
  { to: '/ai', icon: Brain, label: 'AI Insights', roles: ['admin'] },
  { to: '/staff', icon: UserCog, label: 'Team Control', roles: ['admin'] },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()

  const filtered = navItems.filter((item) => item.roles.includes(user?.role))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[290px] flex-col border-r border-white/10 bg-slate-950/85 p-4 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/30">
            <ShoppingBag size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-white">D-Mart Smart</p>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Retail command center</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/8 to-white/5 p-4 shadow-xl shadow-slate-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-emerald-200 ring-1 ring-white/10">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Access</p>
            <p className="text-sm font-medium text-slate-100">{getRoleLabel(user?.role)}</p>
          </div>
          <div className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
            {user?.role}
          </div>
        </div>
      </div>

      <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Workspace</p>
        {filtered.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => onClose()}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all ${
                isActive
                  ? 'border-emerald-400/30 bg-emerald-400/12 text-white shadow-lg shadow-emerald-500/10'
                  : 'border-transparent bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-white'
              }`
            }
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/80 ring-1 ring-white/10">
              <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{label}</p>
            </div>
            {to === '/billing' && cartCount > 0 ? (
              <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-semibold text-slate-950">
                {cartCount}
              </span>
            ) : (
              <ChevronRight size={16} className="text-slate-600 transition-colors group-hover:text-slate-300" />
            )}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:border-rose-400/35 hover:bg-rose-400/15"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </aside>
  )
}
