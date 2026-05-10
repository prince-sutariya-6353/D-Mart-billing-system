import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Clock3, LogOut, Menu, ShoppingCart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { getRoleLabel } from '../../utils/roleUtils'

const PAGE_TITLES = {
  '/dashboard': 'Executive Dashboard',
  '/billing': 'Checkout Counter',
  '/products': 'Product Catalog',
  '/inventory': 'Inventory Control',
  '/customers': 'Customer Desk',
  '/bills': 'Invoices',
  '/ai': 'AI Insights',
  '/staff': 'Team Control',
  '/customer/dashboard': 'My Purchases',
}

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const title = PAGE_TITLES[pathname] || 'D-Mart Smart'
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date()),
    [],
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/70">{todayLabel}</p>
          <h1 className="font-display truncate text-xl font-semibold text-white sm:text-2xl">{title}</h1>
        </div>

        <div className="hidden items-center gap-3 xl:flex">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300">
            <span className="text-slate-500">Role:</span> {getRoleLabel(user?.role)}
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300">
            <Clock3 size={16} className="text-emerald-300" />
            Operations are live
          </div>
        </div>

        <Link
          to="/billing"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
        >
          <ShoppingCart size={18} />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1.5 py-0.5 text-[11px] font-semibold text-slate-950">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
        >
          <Bell size={18} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/30 to-cyan-400/20 text-sm font-semibold text-emerald-100 ring-1 ring-white/10">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="max-w-32 truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-slate-400">{getRoleLabel(user?.role)}</p>
            </div>
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-14 z-20 w-64 rounded-[24px] border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-sm font-medium text-rose-100 transition hover:bg-rose-400/15"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
