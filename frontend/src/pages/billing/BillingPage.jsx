import { useCallback, useMemo, useState } from 'react'
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Globe,
  Loader2,
  Minus,
  Package,
  Plus,
  Receipt,
  ScanLine,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import BarcodeScanner from '../../components/scanner/BarcodeScanner'
import { useCart } from '../../context/CartContext'
import { billingService, customerService, paymentService } from '../../services/billingService'
import { productService } from '../../services/productService'
import { formatCurrency, formatNumber } from '../../utils/formatCurrency'

const paymentOptions = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'razorpay', label: 'Razorpay', icon: Globe },
]

function SummaryCard({ label, value, note }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{note}</p>
    </div>
  )
}

export default function BillingPage() {
  const {
    cartItems,
    customer,
    setCustomer,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    subtotal,
    totalDiscount,
    totalGST,
    grandTotal,
    cartCount,
  } = useCart()

  const [showScanner, setShowScanner] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [phoneSearch, setPhoneSearch] = useState('')
  const [checkoutStep, setCheckoutStep] = useState('cart')
  const [lastBill, setLastBill] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)

  const fetchByBarcode = useCallback(
    async (barcode) => {
      if (!barcode.trim()) return

      setScanning(true)

      try {
        const product = await productService.getByBarcode(barcode.trim())

        if (!product) {
          toast.error('Product not found.')
          return
        }

        if (product.stock <= 0) {
          toast.error(`${product.name} is out of stock.`)
          return
        }

        addToCart(product)
        setBarcodeInput('')
      } catch (error) {
        toast.error(error.response?.data?.message || 'Product not found.')
      } finally {
        setScanning(false)
      }
    },
    [addToCart],
  )

  const handleSearch = async (query) => {
    setSearchInput(query)

    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    try {
      const response = await productService.getAll({ search: query, limit: 8 })
      setSearchResults(response.data || [])
    } catch {
      setSearchResults([])
    }
  }

  const handlePhoneSearch = async () => {
    if (!phoneSearch.trim()) return

    try {
      const existingCustomer = await customerService.getByPhone(phoneSearch.trim())
      setCustomer(existingCustomer)
      setPhoneSearch('')
      toast.success(`Customer found: ${existingCustomer.name}`)
    } catch {
      try {
        const newCustomer = await customerService.create({
          name: 'Walk-in Customer',
          phone: phoneSearch.trim(),
        })
        setCustomer(newCustomer)
        setPhoneSearch('')
        toast.success('Customer profile created.')
      } catch {
        toast.error('Failed to load customer.')
      }
    }
  }

  const checkoutPayload = useMemo(
    () => ({
      items: cartItems.map((item) => ({ product: item._id, quantity: item.quantity })),
      customer: customer
        ? {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            customerId: customer._id,
          }
        : {},
      paymentMethod,
      paymentStatus: paymentMethod === 'razorpay' ? 'pending' : 'paid',
    }),
    [cartItems, customer, paymentMethod],
  )

  const finalizeBill = async (payload) => {
    const bill = await billingService.create(payload)
    setLastBill(bill)
    clearCart()
    setCheckoutStep('success')
    toast.success('Bill created successfully.')
  }

  const handleCheckout = async () => {
    if (!cartItems.length) {
      toast.error('Add products to the cart before checkout.')
      return
    }

    setLoading(true)

    try {
      if (paymentMethod === 'razorpay') {
        if (!window.Razorpay) {
          toast.error('Razorpay checkout is not available in this browser session.')
          return
        }

        const order = await paymentService.createRazorpayOrder(grandTotal)

        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'D-Mart Smart Billing',
          description: 'Store purchase',
          order_id: order.orderId,
          prefill: { name: customer?.name || '', contact: customer?.phone || '' },
          theme: { color: '#10b981' },
          handler: async (response) => {
            await finalizeBill({
              ...checkoutPayload,
              paymentStatus: 'paid',
              razorpayOrderId: order.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
            })
          },
        }

        new window.Razorpay(options).open()
        return
      }

      await finalizeBill(checkoutPayload)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Checkout failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!lastBill?._id) return

    try {
      await billingService.downloadPDF(lastBill._id)
      toast.success('Invoice downloaded.')
    } catch {
      toast.error('Failed to download the invoice.')
    }
  }

  if (checkoutStep === 'success') {
    return (
      <div className="flex min-h-[72vh] items-center justify-center">
        <div className="card max-w-lg text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-400/12">
            <CheckCircle2 size={36} className="text-emerald-200" />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Transaction complete</p>
          <h2 className="mt-2 font-display text-4xl font-semibold text-white">Bill {lastBill?.billNumber}</h2>
          <p className="mt-2 text-sm text-slate-400">The checkout was processed successfully and the invoice is ready.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Grand total" value={formatCurrency(lastBill?.grandTotal)} note="Amount collected" />
            <SummaryCard label="Items" value={formatNumber(lastBill?.items?.length)} note="Lines in the bill" />
            <SummaryCard label="Customer" value={lastBill?.customer?.name || 'Walk-in customer'} note="Assigned profile" />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={handleDownloadPDF} className="btn-secondary flex-1 justify-center">
              <Receipt size={16} />
              Download invoice
            </button>
            <button
              onClick={() => {
                setCheckoutStep('cart')
                setLastBill(null)
              }}
              className="btn-primary flex-1 justify-center"
            >
              Start next bill
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Checkout workspace</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-white">Fast scanning, fast billing, fewer mistakes.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Search items instantly, attach a customer when needed, and complete the sale from one compact checkout flow.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <SummaryCard label="Items in cart" value={formatNumber(cartCount)} note="Live unit count" />
            <SummaryCard label="Subtotal" value={formatCurrency(subtotal)} note="Before GST and discounts" />
            <SummaryCard label="Payable now" value={formatCurrency(grandTotal)} note="Current checkout total" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="card">
            <div className="mb-4 flex items-center gap-3">
              <div className="stat-icon bg-emerald-400/12">
                <ScanLine size={18} className="text-emerald-200" />
              </div>
              <div>
                <h3 className="panel-title">Scan or enter barcode</h3>
                <p className="page-subtitle">Use the barcode input for fast cashier flow or open the camera scanner.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="input pr-11"
                  placeholder="Type or scan a barcode, then press Enter"
                  value={barcodeInput}
                  onChange={(event) => setBarcodeInput(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && fetchByBarcode(barcodeInput)}
                  autoFocus
                />
                {scanning && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-200" />}
              </div>
              <button onClick={() => fetchByBarcode(barcodeInput)} className="btn-primary justify-center px-5">
                <Search size={16} />
                Find
              </button>
              <button onClick={() => setShowScanner(true)} className="btn-secondary justify-center px-5">
                <ScanLine size={16} />
                Open camera
              </button>
            </div>
          </div>

          <div className="card">
            <div className="mb-4 flex items-center gap-3">
              <div className="stat-icon bg-cyan-400/12">
                <Package size={18} className="text-cyan-100" />
              </div>
              <div>
                <h3 className="panel-title">Product search</h3>
                <p className="page-subtitle">Search by product name or barcode and add items with one click.</p>
              </div>
            </div>

            <input
              type="text"
              className="input"
              placeholder="Search products"
              value={searchInput}
              onChange={(event) => handleSearch(event.target.value)}
            />

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => {
                      addToCart(product)
                      setSearchInput('')
                      setSearchResults([])
                    }}
                    className="flex w-full items-center gap-4 rounded-[24px] border border-white/8 bg-slate-950/35 p-4 text-left transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        <Package size={18} className="text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{product.name}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {product.barcode} | Stock: {formatNumber(product.stock)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatCurrency(product.sellingPrice)}</p>
                      <p className="text-xs text-slate-500">{product.discountPercent || 0}% discount</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="mb-4 flex items-center gap-3">
              <div className="stat-icon bg-violet-400/12">
                <UserRound size={18} className="text-violet-100" />
              </div>
              <div>
                <h3 className="panel-title">Customer lookup</h3>
                <p className="page-subtitle">Attach a customer account to the bill to track history and loyalty.</p>
              </div>
            </div>

            {customer ? (
              <div className="flex items-center gap-3 rounded-[24px] border border-emerald-300/20 bg-emerald-400/10 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950/40 text-lg font-semibold text-emerald-100">
                  {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{customer.name}</p>
                  <p className="truncate text-xs text-emerald-100/80">
                    {customer.phone || '-'} | {formatNumber(customer.loyaltyPoints)} loyalty points
                  </p>
                </div>
                <button type="button" onClick={() => setCustomer(null)} className="btn-ghost">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 lg:flex-row">
                <input
                  type="tel"
                  className="input"
                  placeholder="Enter customer phone number"
                  value={phoneSearch}
                  onChange={(event) => setPhoneSearch(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handlePhoneSearch()}
                />
                <button onClick={handlePhoneSearch} className="btn-secondary justify-center px-5">
                  <Search size={16} />
                  Find customer
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="panel-title">Live cart</h3>
              <p className="page-subtitle">Review items, change quantities, and complete payment.</p>
            </div>
            {cartItems.length > 0 && (
              <button onClick={clearCart} className="btn-ghost text-rose-200 hover:text-rose-100">
                <Trash2 size={16} />
                Clear
              </button>
            )}
          </div>

          <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
            {cartItems.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-slate-950/30 px-4 text-center">
                <ShoppingCart size={34} className="text-slate-600" />
                <p className="mt-4 text-sm font-medium text-slate-300">Your cart is empty.</p>
                <p className="mt-1 text-sm text-slate-500">Scan a barcode or search for a product to begin.</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item._id} className="cart-item">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      <Package size={18} className="text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatCurrency(item.sellingPrice)} | GST {item.gstPercent || 0}% | Discount {item.discountPercent || 0}%
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQty(item._id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.08]"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-white">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item._id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/12 text-emerald-100 transition hover:bg-emerald-400/18"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item._id)}
                      className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl border border-rose-300/15 bg-rose-400/10 text-rose-100 transition hover:bg-rose-400/16"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <>
              <div className="mt-5 space-y-3 rounded-[28px] border border-white/10 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">GST</span>
                  <span className="text-amber-200">{formatCurrency(totalGST)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Discount</span>
                  <span className="text-emerald-200">-{formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-sm font-semibold text-white">Amount to collect</span>
                  <span className="font-display text-2xl font-semibold text-white">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="mt-5">
                <p className="label mb-2">Payment method</p>
                <div className="grid grid-cols-2 gap-2">
                  {paymentOptions.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                        paymentMethod === id
                          ? 'border-emerald-300/25 bg-emerald-400/12 text-white'
                          : 'border-white/10 bg-slate-950/35 text-slate-300 hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleCheckout} disabled={loading} className="btn-primary mt-5 w-full justify-center py-3.5 text-base">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                {loading ? 'Processing checkout...' : `Collect ${formatCurrency(grandTotal)}`}
              </button>
            </>
          )}
        </div>
      </section>

      {showScanner && <BarcodeScanner onScan={(value) => { setShowScanner(false); fetchByBarcode(value) }} onClose={() => setShowScanner(false)} />}
    </div>
  )
}
