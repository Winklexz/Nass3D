import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:block md:w-60 md:shrink-0 md:border-r md:border-border">
        <Sidebar />
      </aside>

      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <span className="font-display text-sm font-bold">NASS3D</span>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="rounded-lg border border-border p-2 text-muted-foreground">
              <Menu size={18} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 px-5 py-7 md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
