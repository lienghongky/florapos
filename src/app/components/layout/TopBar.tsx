import { Flower2, ChevronDown, LogOut } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { motion } from 'motion/react';
import { useState } from 'react';

export function TopBar() {
  const { user, logout, stores, selectedStore, setSelectedStore } = useApp();
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  if (!user) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flower2 className="size-6" />
          </div>
          <span className="text-lg font-semibold">FloraPos</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Store selector (owner only) */}
          {user.role === 'owner' && (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 transition-shadow hover:shadow-md"
              >
                <span className="text-sm">{selectedStore?.name}</span>
                <ChevronDown className="size-4" />
              </motion.button>

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
                    className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-white shadow-lg"
                  >
                    {stores.map(store => (
                      <button
                        key={store.id}
                        onClick={() => {
                          setSelectedStore(store);
                          setShowStoreDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted ${selectedStore?.id === store.id ? 'bg-muted' : ''
                          }`}
                      >
                        {store.name}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          )}

          {/* User avatar */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2 transition-shadow hover:shadow-md"
            >
              <div className="size-8 overflow-hidden rounded-full bg-primary/10">
                <div className="flex size-full items-center justify-center text-sm font-medium text-primary">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">{user.name}</div>
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
                  className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-white shadow-lg"
                >
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
