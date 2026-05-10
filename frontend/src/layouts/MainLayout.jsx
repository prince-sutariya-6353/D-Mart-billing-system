import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'
import Topbar from '../components/common/Topbar'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.10),transparent_24%),#08111f] text-slate-50">
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="relative flex min-h-screen flex-1 flex-col">
          <Topbar onMenuClick={() => setSidebarOpen((value) => !value)} />
          <main className="flex-1 px-4 pb-8 pt-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px] animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
