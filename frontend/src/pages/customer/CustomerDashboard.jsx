import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  Download,
  Loader2,
  Mail,
  Phone,
  Receipt,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { billingService } from '../../services/billingService'
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatCurrency'

function CustomerStat({ label, value, note }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{note}</p>
    </div>
  )
}

export default function CustomerDashboard() {
  const [bills, setBills] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [billList, me] = await Promise.all([billingService.getMyBills(), authService.getMe()])
        setBills(billList)
        setProfile(me)
      } catch {
        toast.error('Failed to load your dashboard.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleDownload = async (billId) => {
    setDownloading(billId)

    try {
      await billingService.downloadPDF(billId)
      toast.success('Invoice downloaded.')
    } catch {
      toast.error('Download failed.')
    } finally {
      setDownloading(null)
    }
  }

  const totalSpent = useMemo(() => bills.reduce((sum, bill) => sum + bill.grandTotal, 0), [bills])
  const loyaltyPoints = useMemo(() => Math.floor(totalSpent / 100), [totalSpent])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card text-center">
          <Loader2 size={30} className="mx-auto animate-spin text-emerald-200" />
          <p className="mt-3 text-sm text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Customer portal</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-white">
              Welcome back, {profile?.name?.split(' ')?.[0] || 'Customer'}.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Track recent purchases, download invoices, and keep an eye on your loyalty value from one simple dashboard.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="badge-info">
                <Phone size={12} />
                {profile?.phone || 'Phone not available'}
              </span>
              <span className="badge-purple">
                <Mail size={12} />
                {profile?.email || 'Email not available'}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <CustomerStat label="Loyalty points" value={formatNumber(loyaltyPoints)} note="Based on paid purchases" />
            <CustomerStat label="Orders placed" value={formatNumber(bills.length)} note="Your invoice count" />
            <CustomerStat label="Total spent" value={formatCurrency(totalSpent)} note="Across all purchases" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="panel-title">My invoices</h3>
              <p className="page-subtitle">Download any recent purchase invoice directly from this list.</p>
            </div>
          </div>

          {bills.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-slate-950/35 text-center">
              <Receipt size={34} className="text-slate-600" />
              <p className="mt-4 text-sm font-medium text-slate-300">No purchases yet.</p>
              <p className="mt-1 text-sm text-slate-500">Your digital invoices will appear here after checkout.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => (
                <div key={bill._id} className="flex items-center justify-between gap-4 rounded-[24px] border border-white/8 bg-slate-950/35 p-4">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-emerald-200">{bill.billNumber}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(bill.grandTotal)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(bill.createdAt)} | {formatNumber(bill.items?.length)} items
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(bill._id)}
                    disabled={downloading === bill._id}
                    className="btn-secondary px-4"
                  >
                    {downloading === bill._id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="stat-icon bg-amber-400/12">
                <Award size={18} className="text-amber-100" />
              </div>
              <div>
                <h3 className="panel-title">Loyalty status</h3>
                <p className="page-subtitle">A quick view of your reward progress.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4 rounded-[28px] border border-white/10 bg-slate-950/35 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Current level</span>
                <span className="badge-warning">Reward member</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Points available</span>
                <span className="text-lg font-semibold text-white">{formatNumber(loyaltyPoints)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Reward progress</span>
                <span className="text-sm text-slate-200">{formatCurrency(totalSpent)} spent</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="stat-icon bg-emerald-400/12">
                <Sparkles size={18} className="text-emerald-100" />
              </div>
              <div>
                <h3 className="panel-title">Personal perks</h3>
                <p className="page-subtitle">Offers that fit your recent shopping pattern.</p>
              </div>
            </div>

            <div className="mt-5 rounded-[28px] border border-emerald-300/20 bg-emerald-400/10 p-5">
              <p className="text-sm font-semibold text-emerald-50">Spend more, earn more</p>
              <p className="mt-2 text-3xl font-display font-semibold text-white">15% off</p>
              <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                On your next grocery purchase above {formatCurrency(1000)} when you continue shopping with your linked profile.
              </p>
            </div>

            <div className="mt-4 rounded-[28px] border border-white/10 bg-slate-950/35 p-4">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-slate-300" />
                <div>
                  <p className="text-sm font-semibold text-white">Easy reorders</p>
                  <p className="text-sm text-slate-500">Your digital invoice history makes repeat shopping easier.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
