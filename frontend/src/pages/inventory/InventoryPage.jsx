import { useState, useEffect, useCallback } from 'react'
import { inventoryService } from '../../services/billingService'
import { productService } from '../../services/productService'
import { formatCurrency, formatDate } from '../../utils/formatCurrency'
import toast from 'react-hot-toast'
import { Warehouse, AlertTriangle, RefreshCw, Search, TrendingDown, Package, ArrowUp, ArrowDown, Loader2, ChevronRight } from 'lucide-react'

export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [tab, setTab] = useState('stock')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [prods, movs, sups] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getMovements({ limit: 50 }),
        inventoryService.getSuppliers(),
      ])
      setProducts(prods)
      setMovements(movs)
      setSuppliers(sups)
    } catch { toast.error('Failed to load inventory') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'low' && p.stock <= p.minStock && p.stock > 0) ||
      (statusFilter === 'out' && p.stock === 0) ||
      (statusFilter === 'ok' && p.stock > p.minStock)
    return matchSearch && matchStatus
  })

  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length
  const outOfStockCount = products.filter(p => p.stock === 0).length
  const healthyCount = products.filter(p => p.stock > p.minStock).length

  const stockPercent = (p) => Math.min(100, Math.round((p.stock / (p.minStock * 3)) * 100))

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Track stock levels, movements, and suppliers</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw size={15} /> Refresh</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Healthy Stock', value: healthyCount, icon: Package, color: 'bg-emerald-500/20', iconColor: 'text-emerald-400', filter: 'ok' },
          { label: 'Low Stock Alert', value: lowStockCount, icon: AlertTriangle, color: 'bg-amber-500/20', iconColor: 'text-amber-400', filter: 'low' },
          { label: 'Out of Stock', value: outOfStockCount, icon: TrendingDown, color: 'bg-red-500/20', iconColor: 'text-red-400', filter: 'out' },
        ].map(s => (
          <button key={s.filter} onClick={() => setStatusFilter(s.filter === statusFilter ? 'all' : s.filter)}
            className={`stat-card text-left transition-all ${statusFilter === s.filter ? 'border-brand/40 glow-green' : ''}`}>
            <div className={`stat-icon ${s.color}`}><s.icon size={20} className={s.iconColor} /></div>
            <div><p className="text-dark-400 text-xs mb-1">{s.label}</p><p className="text-2xl font-black text-white">{s.value}</p></div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl border border-dark-700 w-fit">
        {['stock', 'movements', 'suppliers'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-brand text-white shadow-lg' : 'text-dark-400 hover:text-white'
            }`}
          >{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={30} className="animate-spin text-brand" /></div>
      ) : tab === 'stock' ? (
        <div className="card p-0 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-dark-700 flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
              <input type="text" className="input pl-10" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Product</th><th>Barcode</th><th>Category</th><th>Stock</th><th>Min Stock</th><th>Level</th><th>Supplier</th><th>Last Restocked</th></tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const pct = stockPercent(p)
                  const isLow = p.stock <= p.minStock && p.stock > 0
                  const isOut = p.stock === 0
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
                            <Package size={14} className="text-dark-500" />
                          </div>
                          <span className="text-white text-sm font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td><span className="font-mono text-xs text-dark-500">{p.barcode}</span></td>
                      <td><span className="badge-info text-xs">{p.category}</span></td>
                      <td>
                        <span className={`font-bold text-lg ${isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'}`}>
                          {p.stock}
                        </span>
                        {isOut && <span className="ml-1 text-xs text-red-500">OUT</span>}
                        {isLow && !isOut && <AlertTriangle size={12} className="inline ml-1 text-amber-400" />}
                      </td>
                      <td className="text-dark-400">{p.minStock}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-dark-700 rounded-full h-2 min-w-16">
                            <div className={`h-2 rounded-full transition-all ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-dark-500 w-8">{pct}%</span>
                        </div>
                      </td>
                      <td className="text-dark-400 text-xs">{p.supplier?.name || '-'}</td>
                      <td className="text-dark-500 text-xs">{formatDate(p.lastRestocked)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'movements' ? (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Type</th><th>Product</th><th>Qty</th><th>Before</th><th>After</th><th>Reason</th><th>By</th><th>Date</th></tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-dark-600">No stock movements recorded yet</td></tr>
                ) : movements.map(m => (
                  <tr key={m._id}>
                    <td>
                      <span className={`badge-${m.type === 'in' ? 'success' : m.type === 'out' ? 'danger' : 'warning'} flex items-center gap-1 w-fit`}>
                        {m.type === 'in' ? <ArrowUp size={10} /> : m.type === 'out' ? <ArrowDown size={10} /> : null}
                        {m.type}
                      </span>
                    </td>
                    <td className="text-white text-sm">{m.product?.name}</td>
                    <td className={`font-bold ${m.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.type === 'in' ? '+' : '-'}{m.quantity}
                    </td>
                    <td className="text-dark-400">{m.stockBefore}</td>
                    <td className="text-dark-300">{m.stockAfter}</td>
                    <td className="text-dark-400 text-xs max-w-32 truncate">{m.reason}</td>
                    <td className="text-dark-500 text-xs">{m.performedBy?.name || 'System'}</td>
                    <td className="text-dark-500 text-xs">{formatDate(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.length === 0 ? (
            <div className="col-span-full card text-center py-12 text-dark-600">
              <p>No suppliers added yet.</p>
            </div>
          ) : suppliers.map(s => (
            <div key={s._id} className="card hover:border-brand/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-semibold">{s.name}</p>
                  <p className="text-dark-500 text-xs mt-0.5">{s.contactPerson}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/15 px-2 py-1 rounded-lg">
                  <span className="text-amber-400 text-xs font-bold">★ {s.rating}</span>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                {[{ l: 'Phone', v: s.phone }, { l: 'Email', v: s.email || '-' }, { l: 'Address', v: s.address || '-' }].map(r => (
                  <div key={r.l} className="flex justify-between">
                    <span className="text-dark-500">{r.l}</span>
                    <span className="text-dark-300 truncate max-w-40">{r.v}</span>
                  </div>
                ))}
              </div>
              {s.gstin && <p className="text-xs text-dark-600 mt-2 font-mono">GSTIN: {s.gstin}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
