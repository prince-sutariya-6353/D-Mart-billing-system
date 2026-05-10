import { Outlet } from 'react-router-dom'
import { ShieldCheck, Sparkles, Store, Zap } from 'lucide-react'

const highlights = [
  {
    icon: Store,
    title: 'Faster checkout',
    text: 'Scan, search, and bill with fewer clicks across desktop and tablet counters.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-aware access',
    text: 'Admins, staff, cashiers, and customers each get the right workspace by default.',
  },
  {
    icon: Zap,
    title: 'Smarter operations',
    text: 'Inventory, invoices, and customer history stay connected in one retail flow.',
  },
]

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_28%),#07111f] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden rounded-[36px] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur-xl lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              <Sparkles size={14} />
              Retail operating system
            </div>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-tight text-white">
              Modern supermarket billing with cleaner flows and calmer UI.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
              This workspace brings together checkout, stock control, customer history, and reporting in one
              streamlined experience for store teams.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            {highlights.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-[28px] border border-white/10 bg-slate-950/35 p-5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-300/20">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
