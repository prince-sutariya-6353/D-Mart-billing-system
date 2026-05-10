import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { getRoleHomePath } from '../../utils/roleUtils'

const demoAccounts = [
  { role: 'admin', label: 'Admin', email: 'admin@dmart.com', password: 'admin123' },
  { role: 'cashier', label: 'Cashier', email: 'cashier@dmart.com', password: 'cashier123' },
  { role: 'staff', label: 'Staff', email: 'staff@dmart.com', password: 'staff123' },
  { role: 'customer', label: 'Customer', email: 'customer@dmart.com', password: 'customer123' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.email || !form.password) {
      toast.error('Please enter both email and password.')
      return
    }

    setLoading(true)

    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}.`)
      navigate(getRoleHomePath(user.role))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const useDemoAccount = (email, password) => {
    setForm({ email, password })
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-[36px] border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
      <div className="rounded-[30px] border border-white/10 bg-gradient-to-br from-emerald-400/12 via-white/[0.04] to-cyan-400/10 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/25">
              <ShoppingBag size={26} strokeWidth={2.4} />
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold text-white">Sign in to D-Mart Smart</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
              Access billing, stock, customer records, and store operations from a cleaner control panel.
            </p>
          </div>
          <div className="hidden rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-right sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">Status</p>
            <p className="text-sm font-medium text-white">Store ready</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="label">Work Email</span>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                className="input pl-11"
                placeholder="admin@dmart.com"
                value={form.email}
                onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                autoComplete="email"
              />
            </div>
          </label>

          <label className="block">
            <span className="label">Password</span>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pl-11 pr-11"
                placeholder="Enter your password"
                value={form.password}
                onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base">
            {loading ? 'Signing in...' : 'Enter workspace'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Quick demo access</p>
              <p className="text-xs text-slate-400">Load sample credentials for each role.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {demoAccounts.map(({ role, label, email, password }) => (
              <button
                key={role}
                type="button"
                onClick={() => useDemoAccount(email, password)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm font-medium text-slate-100 transition hover:border-emerald-300/25 hover:bg-emerald-400/10 hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
