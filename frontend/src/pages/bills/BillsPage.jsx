import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Download,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { billingService } from '../../services/billingService'
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatCurrency'

const paymentOptions = ['', 'cash', 'upi', 'card', 'razorpay']

function InvoiceStat({ label, value, note }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{note}</p>
    </div>
  )
}

export default function BillsPage() {
  const [bills, setBills] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [selectedBill, setSelectedBill] = useState(null)
  const [downloading, setDownloading] = useState(null)

  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)

    try {
      const params = { page, limit, paymentStatus: 'paid' }
      if (search) params.search = search
      if (paymentMethod) params.paymentMethod = paymentMethod
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const response = await billingService.getAll(params)
      setBills(response.data || [])
      setTotal(response.total || 0)
    } catch {
      toast.error('Failed to load bills.')
    } finally {
      setLoading(false)
    }
  }, [endDate, page, paymentMethod, search, startDate])

  useEffect(() => {
    load()
  }, [load])

  const handleDownload = async (bill) => {
    setDownloading(bill._id)

    try {
      await billingService.downloadPDF(bill._id)
      toast.success('Invoice downloaded.')
    } catch {
      toast.error('Download failed.')
    } finally {
      setDownloading(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const totalValue = useMemo(() => bills.reduce((sum, bill) => sum + bill.grandTotal, 0), [bills])

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Invoice center</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-white">Every paid bill, easy to find and easy to download.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Filter by customer, payment method, or date range to review the exact invoice you need without digging.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <InvoiceStat label="Bills loaded" value={formatNumber(bills.length)} note={`Page ${page} of ${totalPages}`} />
            <InvoiceStat label="Total records" value={formatNumber(total)} note="Paid invoices matched" />
            <InvoiceStat label="Visible value" value={formatCurrency(totalValue)} note="Sum for current list" />
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
              placeholder="Search by bill number, customer name, or phone"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>

          <select className="select xl:w-48" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
            <option value="">All payment methods</option>
            {paymentOptions.filter(Boolean).map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[320px]">
            <input type="date" className="input" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <input type="date" className="input" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>

          <button onClick={load} className="btn-secondary justify-center xl:w-auto">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      <section className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 size={32} className="animate-spin text-emerald-200" />
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>GST</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-slate-500">
                      No bills match the current filters.
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill._id}>
                      <td className="font-mono text-xs text-emerald-200">{bill.billNumber}</td>
                      <td>
                        <div>
                          <p className="text-sm font-medium text-white">{bill.customer?.name || 'Walk-in customer'}</p>
                          <p className="text-xs text-slate-500">{bill.customer?.phone || '-'}</p>
                        </div>
                      </td>
                      <td>{formatNumber(bill.items?.length)}</td>
                      <td className="text-amber-100">{formatCurrency(bill.totalGST)}</td>
                      <td className="text-emerald-100">-{formatCurrency(bill.totalDiscount)}</td>
                      <td className="font-medium text-white">{formatCurrency(bill.grandTotal)}</td>
                      <td>
                        <span className="badge-info capitalize">{bill.paymentMethod}</span>
                      </td>
                      <td className="text-xs text-slate-500">{formatDate(bill.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setSelectedBill(bill)} className="btn-ghost px-2 py-1.5">
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(bill)}
                            disabled={downloading === bill._id}
                            className="btn-ghost px-2 py-1.5"
                          >
                            {downloading === bill._id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Showing {formatNumber(bills.length)} results out of {formatNumber(total)}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="btn-secondary px-4 py-2">
                Previous
              </button>
              <span className="text-sm text-slate-300">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={page === totalPages}
                className="btn-secondary px-4 py-2"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedBill && (
        <div className="modal-overlay">
          <div className="modal-box max-w-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">Invoice detail</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-white">{selectedBill.billNumber}</h3>
                <p className="mt-1 text-sm text-slate-400">{formatDate(selectedBill.createdAt)}</p>
              </div>
              <button type="button" onClick={() => setSelectedBill(null)} className="btn-ghost">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <InvoiceStat label="Customer" value={selectedBill.customer?.name || 'Walk-in'} note={selectedBill.customer?.phone || '-'} />
                <InvoiceStat label="Payment" value={selectedBill.paymentMethod} note="Collected method" />
                <InvoiceStat label="Total" value={formatCurrency(selectedBill.grandTotal)} note="Grand total" />
                <InvoiceStat label="Items" value={formatNumber(selectedBill.items?.length)} note="Line items" />
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-semibold text-white">Items</p>
                <div className="mt-4 space-y-3">
                  {selectedBill.items?.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          Qty {formatNumber(item.quantity)} x {formatCurrency(item.sellingPrice)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-white">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white">{formatCurrency(selectedBill.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">GST</span>
                    <span className="text-amber-100">{formatCurrency(selectedBill.totalGST)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Discount</span>
                    <span className="text-emerald-100">-{formatCurrency(selectedBill.totalDiscount)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="font-medium text-white">Grand total</span>
                    <span className="font-display text-xl font-semibold text-white">{formatCurrency(selectedBill.grandTotal)}</span>
                  </div>
                </div>
              </div>

              <button type="button" onClick={() => handleDownload(selectedBill)} className="btn-primary w-full justify-center">
                <Download size={16} />
                Download invoice PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
