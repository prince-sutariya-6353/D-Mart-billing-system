import { useState, useEffect, useCallback } from 'react'
import { aiService } from '../../services/billingService'
import { formatCurrency } from '../../utils/formatCurrency'
import toast from 'react-hot-toast'
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, RefreshCw,
  Package, Search, Loader2, Star, ChevronRight, Zap, BarChart2,
  ShoppingBag, Globe
} from 'lucide-react'

const RISK_COLORS = {
  critical: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', badge: 'badge-danger' },
  high: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'badge-warning' },
  medium: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'badge-info' },
  low: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'badge-success' },
}

export default function AIPredictionPage() {
  const [tab, setTab] = useState('predictions')
  const [predictions, setPredictions] = useState([])
  const [bestSelling, setBestSelling] = useState([])
  const [slowSelling, setSlowSelling] = useState([])
  const [reorderSuggestions, setReorderSuggestions] = useState([])
  const [supplierData, setSupplierData] = useState(null)
  const [supplierQuery, setSupplierQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [supplierLoading, setSupplierLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [preds, best, slow, reorder] = await Promise.all([
        aiService.getPredictions(),
        aiService.getBestSelling(30),
        aiService.getSlowSelling(),
        aiService.getReorderSuggestions(),
      ])
      setPredictions(preds)
      setBestSelling(best)
      setSlowSelling(slow)
      setReorderSuggestions(reorder)
    } catch (err) {
      toast.error('Failed to load AI predictions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSupplierCompare = async () => {
    if (!supplierQuery.trim()) { toast.error('Enter a product name'); return }
    setSupplierLoading(true)
    try {
      const data = await aiService.getSupplierComparison(supplierQuery)
      setSupplierData(data)
    } catch { toast.error('Supplier comparison failed') }
    finally { setSupplierLoading(false) }
  }

  const TABS = [
    { id: 'predictions', label: 'Stock Predictions', icon: Brain },
    { id: 'best', label: 'Best Sellers', icon: TrendingUp },
    { id: 'slow', label: 'Slow Movers', icon: TrendingDown },
    { id: 'reorder', label: 'Reorder Alerts', icon: AlertTriangle },
    { id: 'supplier', label: 'Supplier Compare', icon: Globe },
  ]

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-purple-400" />
            </div>
            <h1 className="page-title">AI Insights</h1>
          </div>
          <p className="page-subtitle">Smart analytics powered by machine learning & Anakin API</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw size={15} /> Refresh</button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-dark-800 text-dark-400 hover:text-white border border-dark-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Brain size={40} className="animate-pulse text-purple-400 mx-auto mb-3" />
            <p className="text-dark-400">AI is analysing your data...</p>
          </div>
        </div>
      ) : tab === 'predictions' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {Object.entries({ critical: '🔴 Critical', high: '🟠 High', medium: '🔵 Medium', low: '🟢 Low' }).map(([risk, label]) => {
              const count = predictions.filter(p => p.prediction.riskLevel === risk).length
              return (
                <div key={risk} className={`card-sm border ${RISK_COLORS[risk].border} ${RISK_COLORS[risk].bg}`}>
                  <p className={`text-2xl font-black ${RISK_COLORS[risk].text}`}>{count}</p>
                  <p className="text-dark-400 text-xs mt-0.5">{label} Risk</p>
                </div>
              )
            })}
          </div>

          {predictions.length === 0 ? (
            <div className="card text-center py-12 text-dark-600">Add products and start billing to see predictions</div>
          ) : predictions.map((p, i) => {
            const rc = RISK_COLORS[p.prediction.riskLevel]
            return (
              <div key={i} className={`card border ${rc.border} hover:glow-green transition-all`}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-48">
                    <div className={`w-10 h-10 rounded-xl ${rc.bg} flex items-center justify-center flex-shrink-0`}>
                      <Package size={18} className={rc.text} />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{p.product.name}</p>
                      <p className="text-dark-500 text-xs">{p.product.category} • {p.product.barcode}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                    {[
                      { l: 'Current Stock', v: p.product.currentStock, c: p.product.currentStock === 0 ? 'text-red-400' : 'text-white' },
                      { l: 'Daily Avg Sales', v: p.prediction.dailyAvgSales, c: 'text-brand' },
                      { l: 'Days Remaining', v: p.prediction.daysOfStockLeft > 100 ? '100+' : p.prediction.daysOfStockLeft, c: p.prediction.daysOfStockLeft <= 7 ? 'text-red-400' : 'text-white' },
                      { l: 'Suggest Order', v: p.prediction.suggestedOrderQty, c: 'text-emerald-400' },
                    ].map(s => (
                      <div key={s.l}>
                        <p className="text-dark-500 text-xs">{s.l}</p>
                        <p className={`font-bold text-base ${s.c}`}>{s.v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`badge-${p.prediction.riskLevel === 'low' ? 'success' : p.prediction.riskLevel === 'medium' ? 'info' : p.prediction.riskLevel === 'high' ? 'warning' : 'danger'}`}>
                      {p.prediction.riskLevel.toUpperCase()} RISK
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${p.prediction.trend === 'increasing' ? 'text-emerald-400' : p.prediction.trend === 'decreasing' ? 'text-red-400' : 'text-dark-400'}`}>
                      {p.prediction.trend === 'increasing' ? <TrendingUp size={12} /> : p.prediction.trend === 'decreasing' ? <TrendingDown size={12} /> : null}
                      {p.prediction.trend}
                    </span>
                  </div>
                </div>
                <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${rc.bg}`}>
                  <Zap size={12} className={`inline mr-1.5 ${rc.text}`} />
                  <span className="text-dark-300">{p.prediction.insight}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : tab === 'best' ? (
        <div className="space-y-3">
          <div className="card mb-4 bg-gradient-to-r from-brand/10 to-emerald-800/10 border-brand/20">
            <p className="text-brand font-semibold flex items-center gap-2"><TrendingUp size={16} /> Top 10 Best Selling Products (Last 30 Days)</p>
          </div>
          {bestSelling.length === 0 ? (
            <div className="card text-center py-12 text-dark-600">No sales data yet. Start billing!</div>
          ) : bestSelling.map((p, i) => (
            <div key={i} className="card flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                i === 0 ? 'bg-amber-500/30 text-amber-400' : i === 1 ? 'bg-slate-500/30 text-slate-300' : i === 2 ? 'bg-orange-800/30 text-orange-400' : 'bg-dark-700 text-dark-400'
              }`}>#{i + 1}</div>
              <div className="flex-1">
                <p className="text-white font-semibold">{p.name}</p>
                <div className="flex gap-4 mt-1">
                  <span className="text-dark-500 text-xs">{p.totalQuantity} units sold</span>
                  <span className="text-emerald-400 text-xs">{p.orderCount} orders</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-brand font-bold">{formatCurrency(p.revenue)}</p>
                <p className="text-dark-500 text-xs">revenue</p>
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'slow' ? (
        <div className="space-y-3">
          <div className="card mb-4 bg-gradient-to-r from-red-500/10 to-orange-800/10 border-red-500/20">
            <p className="text-red-400 font-semibold flex items-center gap-2"><TrendingDown size={16} /> Slow Moving Products (Less than 5 units in 30 days)</p>
          </div>
          {slowSelling.length === 0 ? (
            <div className="card text-center py-12 text-dark-600">All products are moving well! 🎉</div>
          ) : slowSelling.map((p, i) => (
            <div key={i} className="card border-red-500/20 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingDown size={18} className="text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{p.name}</p>
                <p className="text-dark-500 text-xs">{p.category} • Stock: {p.stock}</p>
              </div>
              <div className="text-right">
                <p className="text-red-400 font-bold">{p.soldInPeriod} sold</p>
                <p className="text-dark-500 text-xs">last 30 days</p>
              </div>
              <div className="bg-amber-500/15 px-3 py-1.5 rounded-lg text-xs text-amber-400 font-medium">
                Consider discount
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'reorder' ? (
        <div className="space-y-3">
          <div className="card mb-4 bg-gradient-to-r from-amber-500/10 to-orange-800/10 border-amber-500/20">
            <p className="text-amber-400 font-semibold flex items-center gap-2"><AlertTriangle size={16} /> AI-Powered Reorder Suggestions</p>
          </div>
          {reorderSuggestions.length === 0 ? (
            <div className="card text-center py-12 text-dark-600">All stock levels are healthy! 🎉</div>
          ) : reorderSuggestions.map((s, i) => (
            <div key={i} className={`card border ${s.urgency === 'critical' ? 'border-red-500/30' : s.urgency === 'high' ? 'border-amber-500/30' : 'border-blue-500/30'}`}>
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold">{s.product.name}</p>
                    <span className={`badge-${s.urgency === 'critical' ? 'danger' : s.urgency === 'high' ? 'warning' : 'info'}`}>
                      {s.urgency.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-dark-500 text-xs">{s.product.category} • {s.product.barcode}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-dark-500 text-xs">Current Stock</p>
                    <p className={`font-bold ${s.currentStock === 0 ? 'text-red-400' : 'text-white'}`}>{s.currentStock}</p>
                  </div>
                  <div>
                    <p className="text-dark-500 text-xs">Daily Sales Avg</p>
                    <p className="font-bold text-white">{s.dailyAvgSales}</p>
                  </div>
                  <div>
                    <p className="text-dark-500 text-xs">Order Qty</p>
                    <p className="font-bold text-emerald-400">{s.suggestedReorderQty}</p>
                  </div>
                </div>
              </div>
              {s.supplier?.name && (
                <div className="mt-3 flex items-center gap-2 text-xs text-dark-400 bg-dark-900 rounded-lg px-3 py-2">
                  <ShoppingBag size={12} className="text-brand" />
                  Supplier: <span className="text-white">{s.supplier.name}</span>
                  {s.supplier.contact && <span className="ml-2">{s.supplier.contact}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Supplier Comparison */
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={16} className="text-brand" />
              <h3 className="font-bold text-white">Supplier Price Comparison</h3>
              <span className="badge-info text-xs">Powered by Anakin AI</span>
            </div>
            <p className="text-dark-400 text-sm mb-4">Enter a product name to get AI-powered supplier price comparison and market intelligence.</p>
            <div className="flex gap-3">
              <input
                type="text" className="input flex-1"
                placeholder="e.g. Amul Butter 500g, Maggi Noodles..."
                value={supplierQuery}
                onChange={e => setSupplierQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSupplierCompare()}
              />
              <button onClick={handleSupplierCompare} disabled={supplierLoading} className="btn-primary px-5">
                {supplierLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {supplierLoading ? 'Analysing...' : 'Compare'}
              </button>
            </div>
          </div>

          {supplierData && (
            <div className="space-y-4 animate-slide-up">
              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { l: 'Market Avg Price', v: `₹${supplierData.market_average_price}`, c: 'text-white' },
                  { l: 'Price Trend', v: supplierData.price_trend, c: supplierData.price_trend === 'rising' ? 'text-red-400' : supplierData.price_trend === 'falling' ? 'text-emerald-400' : 'text-blue-400' },
                  { l: 'Suppliers Found', v: supplierData.suppliers?.length || 0, c: 'text-brand' },
                ].map(s => (
                  <div key={s.l} className="card-sm text-center">
                    <p className={`text-xl font-black ${s.c} capitalize`}>{s.v}</p>
                    <p className="text-dark-500 text-xs mt-1">{s.l}</p>
                  </div>
                ))}
              </div>

              {supplierData.recommendation && (
                <div className="card bg-brand/10 border-brand/20">
                  <div className="flex items-start gap-2">
                    <Zap size={16} className="text-brand mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-brand text-sm font-semibold mb-1">AI Recommendation</p>
                      <p className="text-dark-300 text-sm">{supplierData.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Supplier cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplierData.suppliers?.map((s, i) => (
                  <div key={i} className={`card hover:border-brand/30 transition-all ${i === 0 ? 'border-brand/30 glow-green' : ''}`}>
                    {i === 0 && (
                      <div className="flex items-center gap-1 text-brand text-xs font-semibold mb-2">
                        <Star size={12} fill="currentColor" /> Best Value
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{s.name}</p>
                        <p className="text-dark-500 text-xs">{s.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-brand font-black text-lg">₹{s.price_per_unit}</p>
                        <p className="text-dark-500 text-xs">per unit</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { l: 'Min Order', v: `${s.minimum_order} units` },
                        { l: 'Delivery', v: `${s.delivery_days} days` },
                        { l: 'Rating', v: `★ ${s.rating}` },
                      ].map(r => (
                        <div key={r.l} className="bg-dark-900 rounded-lg p-2 text-center">
                          <p className="text-white font-semibold">{r.v}</p>
                          <p className="text-dark-600 mt-0.5">{r.l}</p>
                        </div>
                      ))}
                    </div>
                    {s.contact && (
                      <p className="text-dark-500 text-xs mt-2">{s.contact}</p>
                    )}
                  </div>
                ))}
              </div>

              {supplierData.note && (
                <p className="text-dark-600 text-xs text-center italic">{supplierData.note}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
