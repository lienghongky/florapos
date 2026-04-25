import { Flower2, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { motion } from 'motion/react';
import { useState } from 'react';

export function TopBar() {
  const { user, logout, stores, selectedStore, setSelectedStore, isSidebarCollapsed, toggleMobileSidebar } = useApp();
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  if (!user) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">

        {/* Left side: hamburger (mobile) + logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger: only visible on mobile */}
          <button
            onClick={toggleMobileSidebar}
            className="flex size-9 items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors md:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          {/* Logo — hidden on desktop when sidebar is expanded (sidebar shows it) */}
          <div className={`flex items-center gap-2 transition-opacity duration-200 ${!isSidebarCollapsed ? 'md:opacity-0 md:pointer-events-none md:w-0 md:overflow-hidden' : ''}`}>
            <div className="flex size-8 md:size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <Flower2 className="size-4 md:size-6" />
            </div>
            <span className="text-base md:text-lg font-semibold hidden sm:block">FloraPos</span>
          </div>
        </div>

        {/* Right side: store selector + user */}
        <div className="flex items-center gap-2 md:gap-4">

          {/* Store Name/Selector */}
          <div className="relative">
            {user.role === 'owner' ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                className="flex items-center gap-1.5 md:gap-2 rounded-lg border border-border bg-white px-3 md:px-4 py-2 transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Active Store</span>
                  <span className="text-xs md:text-sm font-black text-slate-700 max-w-[100px] md:max-w-none truncate line-clamp-1">{selectedStore?.name || 'Loading...'}</span>
                </div>
                <ChevronDown className="size-3.5 md:size-4 shrink-0 text-slate-400" />
              </motion.button>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Current Location</span>
                <span className="text-sm font-black text-slate-600">{selectedStore?.name || 'Loading...'}</span>
              </div>
            )}

              {showStoreDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowStoreDropdown(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-20 mt-2 w-48 md:w-56 overflow-hidden rounded-lg border border-border bg-white shadow-lg"
                  >
                    {stores.map(store => (
                      <button
                        key={store.id}
                        onClick={() => {
                          setSelectedStore(store);
                          setShowStoreDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted ${selectedStore?.id === store.id ? 'bg-muted' : ''}`}
                      >
                        {store.name}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </div>

          {/* User avatar */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 md:gap-3 rounded-lg border border-border bg-white px-2 md:px-3 py-2 transition-shadow hover:shadow-md"
            >
              <div className="size-7 md:size-8 overflow-hidden rounded-full bg-primary/10 shrink-0">
                <div className="flex size-full items-center justify-center text-xs md:text-sm font-medium text-primary">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              {/* Name only on sm+ */}
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium leading-tight">{user.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
              </div>
            </motion.button>

            {showUserDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-20 mt-2 w-44 md:w-48 overflow-hidden rounded-lg border border-border bg-white shadow-lg"
                >
                  {/* User info on mobile (not shown in avatar) */}
                  <div className="px-4 py-3 border-b border-border sm:hidden">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted"
                  >
                    <LogOut className="size-4" />
                    <span>Logout</span>
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
