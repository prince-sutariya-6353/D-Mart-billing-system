import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Brain,
  CreditCard,
  Loader2,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import toast from 'react-hot-toast'
import { dashboardService } from '../../services/billingService'
import { formatCompactCurrency, formatCurrency, formatDate, formatNumber } from '../../utils/formatCurrency'

const chartPalette = ['#34d399', '#38bdf8', '#f59e0b', '#a78bfa', '#fb7185']

function MetricCard({ title, value, note, icon: Icon, accent }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${accent}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className="mt-1 font-display text-3xl font-semibold text-white">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{note}</p>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-xl shadow-black/30">
      <p className="text-sm font-medium text-white">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4 text-xs">
            <span style={{ color: item.color }} className="font-medium capitalize">
              {item.name}
            </span>
            <span className="text-slate-200">
              {item.name === 'revenue' || item.name === 'total'
                ? formatCurrency(item.value)
                : formatNumber(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)

    try {
      const year = new Date().getFullYear()
      const [summary, monthlySales] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getMonthly(year),
      ])

      setStats(summary)
      setMonthly(monthlySales)
    } catch (error) {
      toast.error('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const overview = stats?.overview || {}
  const topRevenueProduct = stats?.topProducts?.[0]
  const todayMix = useMemo(
    () => [
      {
        label: 'Today',
        revenue: overview.todayRevenue || 0,
        orders: overview.todayOrders || 0,
      },
      {
        label: 'This week',
        revenue: overview.weekRevenue || 0,
        orders: overview.weekOrders || 0,
      },
      {
        label: 'This month',
        revenue: overview.monthRevenue || 0,
        orders: overview.monthOrders || 0,
      },
    ],
    [overview],
  )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card max-w-sm text-center">
          <Loader2 size={30} className="mx-auto animate-spin text-emerald-300" />
          <p className="mt-3 text-sm text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Store pulse</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-white">
              Revenue, checkout, and stock are all visible in one place.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Keep the front counter moving while spotting low stock, payment mix, and top-selling items before they
              become a problem.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={load} className="btn-primary">
                <RefreshCw size={16} />
                Refresh numbers
              </button>
              <Link to="/ai" className="btn-secondary">
                <Brain size={16} />
                Open AI insights
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {todayMix.map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatCompactCurrency(item.revenue)}</p>
                <p className="mt-1 text-sm text-slate-400">{formatNumber(item.orders)} orders</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total revenue"
          value={formatCurrency(overview.totalRevenue)}
          note={`${formatNumber(overview.totalOrders)} completed orders`}
          icon={TrendingUp}
          accent="bg-gradient-to-br from-emerald-500 to-emerald-700"
        />
        <MetricCard
          title="Products in catalog"
          value={formatNumber(overview.totalProducts)}
          note={`${formatNumber(overview.outOfStockProducts)} marked out of stock`}
          icon={Boxes}
          accent="bg-gradient-to-br from-cyan-500 to-blue-700"
        />
        <MetricCard
          title="Customers served today"
          value={formatNumber(overview.todayOrders)}
          note={`Sales today: ${formatCurrency(overview.todayRevenue)}`}
          icon={ShoppingCart}
          accent="bg-gradient-to-br from-violet-500 to-violet-700"
        />
        <MetricCard
          title="Low stock alerts"
          value={formatNumber(overview.lowStockProducts)}
          note={`${formatNumber(overview.totalStaff)} active team accounts`}
          icon={AlertTriangle}
          accent="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="card">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="panel-title">Revenue trend</h3>
              <p className="page-subtitle">Daily billed revenue versus order count for the last 7 days.</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats?.salesChart || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="dashboardOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompactCurrency}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2.5} fill="url(#dashboardRevenue)" />
              <Area type="monotone" dataKey="orders" stroke="#38bdf8" strokeWidth={2} fill="url(#dashboardOrders)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="mb-5">
            <h3 className="panel-title">Payment mix</h3>
            <p className="page-subtitle">Understand which payment method drives the most value.</p>
          </div>

          {stats?.paymentBreakdown?.length ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.paymentBreakdown}
                    dataKey="total"
                    innerRadius={60}
                    outerRadius={82}
                    paddingAngle={4}
                  >
                    {stats.paymentBreakdown.map((item, index) => (
                      <Cell key={item._id} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2">
                {stats.paymentBreakdown.map((item, index) => (
                  <div key={item._id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-950/35 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
                      />
                      <span className="text-sm capitalize text-slate-200">{item._id}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{formatCurrency(item.total)}</p>
                      <p className="text-xs text-slate-500">{formatNumber(item.count)} payments</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-slate-950/35 px-4 py-10 text-center text-sm text-slate-500">
              No payment data is available yet.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="card">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="panel-title">Monthly performance</h3>
              <p className="page-subtitle">Revenue across the current year.</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompactCurrency}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" fill="#34d399" radius={[10, 10, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="panel-title">Top selling products</h3>
              <p className="page-subtitle">
                {topRevenueProduct
                  ? `${topRevenueProduct.name} is currently leading the shelf.`
                  : 'Start billing to build product rankings.'}
              </p>
            </div>
            <Link to="/products" className="btn-secondary px-4">
              Open catalog
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.topProducts?.length ? (
              stats.topProducts.map((product, index) => {
                const width = Math.max(
                  10,
                  ((product.totalSold || 0) / Math.max(stats.topProducts[0]?.totalSold || 1, 1)) * 100,
                )

                return (
                  <div key={product._id || product.name} className="rounded-[24px] border border-white/8 bg-slate-950/35 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Rank {index + 1}</p>
                        <p className="truncate text-sm font-semibold text-white">{product.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{formatCurrency(product.revenue)}</p>
                        <p className="text-xs text-slate-500">{formatNumber(product.totalSold)} units sold</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/6">
                      <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-slate-950/35 px-4 py-10 text-center text-sm text-slate-500">
                No top-selling products yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="panel-title">Recent invoices</h3>
              <p className="page-subtitle">The latest completed bills from the checkout counter.</p>
            </div>
            <Link to="/bills" className="btn-secondary px-4">
              See all bills
            </Link>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Customer</th>
                  <th>Cashier</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentBills?.length ? (
                  stats.recentBills.map((bill) => (
                    <tr key={bill._id}>
                      <td className="font-mono text-xs text-emerald-200">{bill.billNumber}</td>
                      <td>{bill.customer?.name || 'Walk-in customer'}</td>
                      <td>{bill.cashierId?.name || '-'}</td>
                      <td>
                        <span className="badge-info capitalize">{bill.paymentMethod}</span>
                      </td>
                      <td className="font-medium text-white">{formatCurrency(bill.grandTotal)}</td>
                      <td className="text-xs text-slate-500">{formatDate(bill.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No recent invoices yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="panel-title">Operational focus</h3>
                <p className="page-subtitle">Where the store team should act next.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[24px] border border-amber-300/15 bg-amber-400/10 p-4">
                <p className="text-sm font-semibold text-amber-100">Low stock follow-up</p>
                <p className="mt-1 text-sm text-amber-50/80">
                  {formatNumber(overview.lowStockProducts)} products are at or below their minimum stock level.
                </p>
              </div>
              <div className="rounded-[24px] border border-cyan-300/15 bg-cyan-400/10 p-4">
                <p className="text-sm font-semibold text-cyan-100">Checkout momentum</p>
                <p className="mt-1 text-sm text-cyan-50/80">
                  {formatNumber(overview.todayOrders)} orders were billed today for {formatCurrency(overview.todayRevenue)}.
                </p>
              </div>
              <div className="rounded-[24px] border border-emerald-300/15 bg-emerald-400/10 p-4">
                <p className="text-sm font-semibold text-emerald-100">Top performer</p>
                <p className="mt-1 text-sm text-emerald-50/80">
                  {topRevenueProduct ? `${topRevenueProduct.name} is the current best seller.` : 'No product trends yet.'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="panel-title">Quick access</h3>
                <p className="page-subtitle">Jump into tasks that usually need attention first.</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {[
                { to: '/billing', label: 'Create a new bill', icon: CreditCard },
                { to: '/products', label: 'Review product catalog', icon: Boxes },
                { to: '/customers', label: 'Open customer desk', icon: Users },
              ].map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5">
                      <Icon size={16} />
                    </span>
                    {label}
                  </span>
                  <ArrowRight size={16} className="text-slate-500" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
