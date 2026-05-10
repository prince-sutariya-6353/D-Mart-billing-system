import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { productService } from '../../services/productService'
import { formatCurrency, formatDateOnly } from '../../utils/formatCurrency'
import toast from 'react-hot-toast'
import {
  Plus, Search, Filter, Edit2, Trash2, Package, AlertTriangle,
  RefreshCw, BarChart2, ChevronDown, X, Loader2, Image as ImageIcon
} from 'lucide-react'

const CATEGORIES = ['All', 'Groceries', 'Dairy', 'Beverages', 'Snacks', 'Personal Care', 'Household', 'Fruits & Vegetables', 'Bakery', 'Frozen Foods', 'Electronics', 'Other']
const STATUSES = ['all', 'active', 'out_of_stock', 'inactive']

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [stockModal, setStockModal] = useState(null)
  const [stockQty, setStockQty] = useState(1)
  const [stockType, setStockType] = useState('in')
  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT }
      if (search) params.search = search
      if (category !== 'All') params.category = category
      if (status !== 'all') params.status = status
      const res = await productService.getAll(params)
      setProducts(res.data || [])
      setTotal(res.total || 0)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }, [search, category, status, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await productService.delete(deleteTarget._id)
      toast.success('Product deleted')
      setDeleteTarget(null)
      load()
    } catch { toast.error('Delete failed') }
    finally { setDeleting(false) }
  }

  const handleStockUpdate = async () => {
    if (!stockModal) return
    try {
      await productService.updateStock(stockModal._id, { quantity: stockQty, type: stockType, reason: 'Manual update' })
      toast.success('Stock updated!')
      setStockModal(null)
      load()
    } catch { toast.error('Stock update failed') }
  }

  const statusBadge = (s) => ({
    active: 'badge-success',
    out_of_stock: 'badge-danger',
    inactive: 'badge-info',
  }[s] || 'badge-info')

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{total} products in inventory</p>
        </div>
        <Link to="/products/add" className="btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
          <input
            type="text" placeholder="Search products or barcode..."
            className="input pl-10"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="select w-auto" value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="select w-auto" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace('_', ' ')}</option>)}
        </select>
        <button onClick={load} className="btn-ghost">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={30} className="animate-spin text-brand" />
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th><th>Barcode</th><th>Category</th>
                  <th>Price</th><th>GST</th><th>Stock</th>
                  <th>Status</th><th>Supplier</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16 text-dark-600">
                    <Package size={36} className="mx-auto mb-3 opacity-30" />
                    <p>No products found</p>
                    <Link to="/products/add" className="text-brand text-sm hover:underline mt-2 block">Add your first product →</Link>
                  </td></tr>
                ) : products.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-dark-700 border border-dark-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-dark-500" />}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{p.name}</p>
                          <p className="text-dark-500 text-xs">{p.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-mono text-xs text-dark-400 bg-dark-900 px-2 py-0.5 rounded">{p.barcode}</span></td>
                    <td><span className="badge-info">{p.category}</span></td>
                    <td>
                      <div>
                        <p className="text-white font-semibold text-sm">{formatCurrency(p.sellingPrice)}</p>
                        <p className="text-dark-600 text-xs">cost: {formatCurrency(p.purchasePrice)}</p>
                      </div>
                    </td>
                    <td><span className="text-amber-400 text-sm">{p.gstPercent}%</span></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold text-sm ${p.stock <= p.minStock ? 'text-red-400' : 'text-white'}`}>{p.stock}</span>
                        {p.stock <= p.minStock && p.stock > 0 && <AlertTriangle size={12} className="text-amber-400" />}
                        <button
                          onClick={() => { setStockModal(p); setStockQty(1); setStockType('in') }}
                          className="ml-1 text-xs text-brand hover:underline"
                        >Edit</button>
                      </div>
                    </td>
                    <td><span className={statusBadge(p.status)}>{p.status?.replace('_', ' ')}</span></td>
                    <td>
                      <p className="text-dark-300 text-xs">{p.supplier?.name || '-'}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link to={`/products/edit/${p._id}`} className="btn-ghost py-1.5 px-2 text-blue-400 hover:text-blue-300">
                          <Edit2 size={14} />
                        </Link>
                        <button onClick={() => setDeleteTarget(p)} className="btn-ghost py-1.5 px-2 text-red-400 hover:text-red-300">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
            <p className="text-dark-500 text-sm">Showing {products.length} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Prev</button>
              <span className="text-dark-400 text-sm flex items-center px-2">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-box max-w-sm">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Product?</h3>
              <p className="text-dark-400 text-sm mb-5">
                Are you sure you want to delete <strong className="text-white">"{deleteTarget.name}"</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1 justify-center">
                  {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {stockModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-1">Update Stock</h3>
              <p className="text-dark-400 text-sm mb-4">{stockModal.name} • Current: <strong className="text-white">{stockModal.stock}</strong></p>
              <div className="space-y-3">
                <div>
                  <label className="label">Update Type</label>
                  <select className="select" value={stockType} onChange={e => setStockType(e.target.value)}>
                    <option value="in">Add Stock (Restock)</option>
                    <option value="out">Remove Stock</option>
                    <option value="adjustment">Set Exact Quantity</option>
                  </select>
                </div>
                <div>
                  <label className="label">Quantity</label>
                  <input type="number" min={1} className="input" value={stockQty} onChange={e => setStockQty(parseInt(e.target.value) || 1)} />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStockModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={handleStockUpdate} className="btn-primary flex-1 justify-center">Update Stock</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
