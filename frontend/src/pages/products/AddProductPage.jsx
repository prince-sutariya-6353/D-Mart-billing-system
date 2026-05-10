import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { productService } from '../../services/productService'
import { formatCurrency } from '../../utils/formatCurrency'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Save, Package, Barcode, RefreshCw, Image as ImageIcon, Loader2, Zap
} from 'lucide-react'

const CATEGORIES = ['Groceries', 'Dairy', 'Beverages', 'Snacks', 'Personal Care', 'Household', 'Fruits & Vegetables', 'Bakery', 'Frozen Foods', 'Electronics', 'Other']
const UNITS = ['pcs', 'kg', 'g', 'litre', 'ml', 'dozen', 'pack', 'box']
const GST_SLABS = [0, 5, 12, 18, 28]

const generateBarcode = () => {
  const prefix = '890'
  const product = String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')
  const base = prefix + product
  let sum = 0
  for (let i = 0; i < 12; i++) sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3)
  return base + (10 - (sum % 10)) % 10
}

const initialForm = {
  name: '', barcode: '', category: 'Groceries', description: '',
  purchasePrice: '', sellingPrice: '', gstPercent: 0, discountPercent: 0,
  stock: '', minStock: 10, unit: 'pcs', status: 'active',
  supplier: { name: '', contact: '', email: '' },
  expiryDate: '',
}

export default function AddProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(initialForm)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    const fetch = async () => {
      try {
        const p = await productService.getById(id)
        setForm({
          name: p.name || '', barcode: p.barcode || '',
          category: p.category || 'Groceries', description: p.description || '',
          purchasePrice: p.purchasePrice || '', sellingPrice: p.sellingPrice || '',
          gstPercent: p.gstPercent || 0, discountPercent: p.discountPercent || 0,
          stock: p.stock || 0, minStock: p.minStock || 10, unit: p.unit || 'pcs',
          status: p.status || 'active',
          supplier: p.supplier || { name: '', contact: '', email: '' },
          expiryDate: p.expiryDate ? p.expiryDate.split('T')[0] : '',
        })
        if (p.image) setImagePreview(p.image)
      } catch { toast.error('Failed to load product') }
      finally { setFetchLoading(false) }
    }
    fetch()
  }, [id, isEdit])

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const setSupplier = (key, val) => setForm(p => ({ ...p, supplier: { ...p.supplier, [key]: val } }))

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const calcMargin = () => {
    if (!form.purchasePrice || !form.sellingPrice) return null
    return (((form.sellingPrice - form.purchasePrice) / form.purchasePrice) * 100).toFixed(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.barcode || !form.sellingPrice) {
      toast.error('Name, barcode and selling price are required')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'supplier') fd.append(k, JSON.stringify(v))
        else fd.append(k, v)
      })
      if (image) fd.append('image', image)

      if (isEdit) {
        await productService.update(id, fd)
        toast.success('Product updated!')
      } else {
        await productService.create(fd)
        toast.success('Product added!')
      }
      navigate('/products')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={30} className="animate-spin text-brand" />
    </div>
  )

  const margin = calcMargin()

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/products')} className="btn-ghost mb-3 -ml-2 text-dark-400">
            <ArrowLeft size={16} /> Back to Products
          </button>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update product information' : 'Add a new product to your inventory'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Main info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Basic Info */}
            <div className="card space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Package size={16} className="text-brand" /> Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Product Name *</label>
                  <input type="text" className="input" placeholder="e.g. Amul Butter 500g" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Barcode *</label>
                  <div className="flex gap-2">
                    <input type="text" className="input font-mono" placeholder="EAN-13 barcode" value={form.barcode} onChange={e => set('barcode', e.target.value)} required />
                    <button type="button" onClick={() => set('barcode', generateBarcode())} className="btn-secondary px-3 flex-shrink-0" title="Auto-generate barcode">
                      <Zap size={15} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select className="select" value={form.unit} onChange={e => set('unit', e.target.value)}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Description</label>
                  <textarea rows={2} className="input resize-none" placeholder="Product description..." value={form.description} onChange={e => set('description', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Pricing & Tax</h3>
                {margin && (
                  <span className={`text-sm font-semibold px-2 py-1 rounded-lg ${parseFloat(margin) > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    Margin: {margin}%
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Purchase Price (₹) *</label>
                  <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} />
                </div>
                <div>
                  <label className="label">Selling Price (₹) *</label>
                  <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)} required />
                </div>
                <div>
                  <label className="label">GST %</label>
                  <select className="select" value={form.gstPercent} onChange={e => set('gstPercent', parseInt(e.target.value))}>
                    {GST_SLABS.map(g => <option key={g} value={g}>{g}% GST</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Discount %</label>
                  <input type="number" min="0" max="100" className="input" placeholder="0" value={form.discountPercent} onChange={e => set('discountPercent', e.target.value)} />
                </div>
              </div>
              {form.sellingPrice && (
                <div className="bg-dark-900 rounded-xl p-3 text-sm space-y-1 border border-dark-700">
                  <div className="flex justify-between text-dark-400">
                    <span>Base Price</span><span className="text-white">{formatCurrency(form.sellingPrice)}</span>
                  </div>
                  <div className="flex justify-between text-dark-400">
                    <span>GST ({form.gstPercent}%)</span>
                    <span className="text-amber-400">+{formatCurrency(form.sellingPrice * form.gstPercent / 100)}</span>
                  </div>
                  <div className="flex justify-between text-dark-400">
                    <span>Discount ({form.discountPercent}%)</span>
                    <span className="text-emerald-400">-{formatCurrency(form.sellingPrice * form.discountPercent / 100)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-dark-700 pt-1 mt-1">
                    <span className="text-white">Customer Pays</span>
                    <span className="text-brand">{formatCurrency(form.sellingPrice * (1 + form.gstPercent / 100) * (1 - form.discountPercent / 100))}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stock */}
            <div className="card space-y-4">
              <h3 className="font-bold text-white">Stock Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Current Stock</label>
                  <input type="number" min="0" className="input" placeholder="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
                </div>
                <div>
                  <label className="label">Min Stock (Alert Level)</label>
                  <input type="number" min="0" className="input" placeholder="10" value={form.minStock} onChange={e => set('minStock', e.target.value)} />
                </div>
                <div>
                  <label className="label">Expiry Date (optional)</label>
                  <input type="date" className="input" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Supplier */}
            <div className="card space-y-4">
              <h3 className="font-bold text-white">Supplier Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Supplier Name</label>
                  <input type="text" className="input" placeholder="Company name" value={form.supplier.name} onChange={e => setSupplier('name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Contact</label>
                  <input type="text" className="input" placeholder="+91-XXXXXXXXXX" value={form.supplier.contact} onChange={e => setSupplier('contact', e.target.value)} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" placeholder="supplier@email.com" value={form.supplier.email} onChange={e => setSupplier('email', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Image */}
          <div className="space-y-5">
            <div className="card">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <ImageIcon size={16} className="text-brand" /> Product Image
              </h3>
              <div
                className="relative border-2 border-dashed border-dark-600 rounded-xl overflow-hidden cursor-pointer hover:border-brand/50 transition-colors group"
                style={{ aspectRatio: '1' }}
                onClick={() => document.getElementById('product-image').click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-dark-600 group-hover:text-dark-400 transition-colors">
                    <ImageIcon size={36} className="mb-2" />
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
                  </div>
                )}
                {imagePreview && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <p className="text-white text-sm font-medium">Change Image</p>
                  </div>
                )}
              </div>
              <input id="product-image" type="file" accept="image/*" className="hidden" onChange={handleImage} />
              {imagePreview && (
                <button type="button" onClick={() => { setImage(null); setImagePreview('') }}
                  className="btn-ghost w-full justify-center mt-2 text-red-400 hover:text-red-300">
                  Remove Image
                </button>
              )}
            </div>

            {/* Quick summary */}
            <div className="card bg-brand/5 border-brand/20">
              <h3 className="font-semibold text-brand text-sm mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                {[
                  { l: 'Name', v: form.name || '-' },
                  { l: 'Category', v: form.category },
                  { l: 'Price', v: form.sellingPrice ? formatCurrency(form.sellingPrice) : '-' },
                  { l: 'Stock', v: form.stock || '0' },
                ].map(r => (
                  <div key={r.l} className="flex justify-between">
                    <span className="text-dark-500">{r.l}</span>
                    <span className="text-white font-medium truncate max-w-32">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <button type="button" onClick={() => navigate('/products')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
