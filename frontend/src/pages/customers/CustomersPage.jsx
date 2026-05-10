import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  History,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Star,
  Users,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { customerService } from '../../services/billingService'
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatCurrency'

const tierStyles = {
  Platinum: 'badge-info',
  Gold: 'badge-warning',
  Silver: 'badge-purple',
  Bronze: 'badge-success',
}

function CustomerStat({ label, value, note }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{note}</p>
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [history, setHistory] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)

    try {
      const response = await customerService.getAll({ search, tier, page, limit: 20 })
      setCustomers(response.data || [])
      setTotal(response.total || 0)
    } catch {
      toast.error('Failed to load customers.')
    } finally {
      setLoading(false)
    }
  }, [page, search, tier])

  useEffect(() => {
    load()
  }, [load])

  const loadHistory = async (customer) => {
    setSelectedCustomer(customer)
    setHistoryLoading(true)

    try {
      const data = await customerService.getHistory(customer._id)
      setHistory(data)
    } catch {
      toast.error('Failed to load customer history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  const topTierCount = useMemo(
    () => customers.filter((customer) => ['Gold', 'Platinum'].includes(customer.tier)).length,
    [customers],
  )

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Customer desk</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-white">Customer history that cashiers and staff can actually use.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Search customers, review their purchase history, and spot loyalty value without jumping between screens.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <CustomerStat label="Profiles loaded" value={formatNumber(customers.length)} note="Customers on this page" />
            <CustomerStat label="Registered total" value={formatNumber(total)} note="Across the filtered list" />
            <CustomerStat label="High-value tiers" value={formatNumber(topTierCount)} note="Gold or Platinum in view" />
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              className="input pl-11"
              placeholder="Search by customer name, phone, or email"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>

          <select className="select xl:w-52" value={tier} onChange={(event) => setTier(event.target.value)}>
            <option value="">All tiers</option>
            {['Bronze', 'Silver', 'Gold', 'Platinum'].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <button onClick={load} className="btn-secondary justify-center xl:w-auto">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      {loading ? (
        <div className="card flex min-h-[260px] items-center justify-center">
          <Loader2 size={30} className="animate-spin text-emerald-200" />
        </div>
      ) : customers.length === 0 ? (
        <div className="card flex min-h-[260px] flex-col items-center justify-center text-center">
          <Users size={34} className="text-slate-600" />
          <p className="mt-4 text-sm font-medium text-slate-300">No customers match the current filters.</p>
          <p className="mt-1 text-sm text-slate-500">Customer profiles are created automatically during billing.</p>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => (
            <button
              key={customer._id}
              type="button"
              onClick={() => loadHistory(customer)}
              className="card text-left transition hover:-translate-y-0.5 hover:border-emerald-300/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-lg font-semibold text-emerald-100 ring-1 ring-white/10">
                    {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{customer.name}</p>
                    <span className={tierStyles[customer.tier] || 'badge-success'}>{customer.tier}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatCurrency(customer.totalSpent)}</p>
                  <p className="text-xs text-slate-500">{formatNumber(customer.totalVisits)} visits</p>
                </div>
              </div>

              <div className="mt-5 space-y-2 rounded-[24px] border border-white/8 bg-slate-950/35 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Phone size={14} className="text-slate-500" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Mail size={14} className="text-slate-500" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-amber-100">
                  <Star size={14} />
                  <span>{formatNumber(customer.loyaltyPoints)} loyalty points</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-100">
                <History size={14} />
                View purchase history
              </div>
            </button>
          ))}
        </section>
      )}

      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-box max-w-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">Customer profile</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-white">{selectedCustomer.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{selectedCustomer.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null)
                  setHistory(null)
                }}
                className="btn-ghost"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <CustomerStat label="Lifetime spend" value={formatCurrency(selectedCustomer.totalSpent)} note="Recorded purchases" />
                <CustomerStat label="Visits" value={formatNumber(selectedCustomer.totalVisits)} note="Total bills" />
                <CustomerStat label="Loyalty" value={formatNumber(selectedCustomer.loyaltyPoints)} note="Reward points" />
                <CustomerStat label="Tier" value={selectedCustomer.tier} note="Current loyalty level" />
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-semibold text-white">Recent purchases</p>
                {historyLoading ? (
                  <div className="flex min-h-[160px] items-center justify-center">
                    <Loader2 size={28} className="animate-spin text-emerald-200" />
                  </div>
                ) : history?.bills?.length ? (
                  <div className="mt-4 space-y-3">
                    {history.bills.map((bill) => (
                      <div key={bill._id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <div>
                          <p className="font-mono text-xs text-emerald-200">{bill.billNumber}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDate(bill.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">{formatCurrency(bill.grandTotal)}</p>
                          <span className="badge-info capitalize">{bill.paymentMethod}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[160px] items-center justify-center text-sm text-slate-500">
                    No purchase history is available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
