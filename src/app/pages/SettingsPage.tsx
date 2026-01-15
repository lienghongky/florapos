import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useApp } from '@/app/context/AppContext';
import { motion } from 'motion/react';
import { User, Bell, Globe, Shield } from 'lucide-react';
import { useState } from 'react';

export function SettingsPage() {
  const { user } = useApp();
  const [notifications, setNotifications] = useState({
    email: true,
    lowStock: true,
    dailyReport: false,
  });
  const [language, setLanguage] = useState('en');

  return (
    <AnimatedPage className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="size-5" />
            </div>
            <h2 className="text-lg font-semibold">Profile Information</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.name}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Role</label>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                <Shield className="size-4 text-primary" />
                <span className="text-sm font-medium capitalize text-primary">{user?.role}</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground shadow-sm"
            >
              Save Changes
            </motion.button>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="size-5" />
            </div>
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'email' as const, label: 'Email Notifications', description: 'Receive email updates about orders' },
              { key: 'lowStock' as const, label: 'Low Stock Alerts', description: 'Get notified when products are low in stock' },
              { key: 'dailyReport' as const, label: 'Daily Reports', description: 'Receive daily sales summary' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    notifications[item.key] ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: notifications[item.key] ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm"
                  />
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Language Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Globe className="size-5" />
            </div>
            <h2 className="text-lg font-semibold">Language & Region</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Language</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
