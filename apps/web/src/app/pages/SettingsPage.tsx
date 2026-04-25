import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { User, Bell, Globe, Shield, UserPlus, Trash2, Edit2, X, Check, Store } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { StoreProfileSection } from '@/app/components/settings/StoreProfileSection';
import { PageHeader } from '@/app/components/ui/page-header';

export function SettingsPage() {
  const { user, users, createStaff, deleteStaff, updateStaff, toggleActiveStaff } = useApp();
  const [notifications, setNotifications] = useState({
    email: true,
    lowStock: true,
    dailyReport: false,
  });
  const [language, setLanguage] = useState('en');

  // User Management state
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ full_name: '', email: '', password: '', role: 'STAFF' });
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await createStaff(newStaff);
      toast.success("Staff member added successfully");
      setIsAddingStaff(false);
      setNewStaff({ full_name: '', email: '', password: '', role: 'STAFF' });
    } catch (error: any) {
      toast.error(error.message || "Failed to add staff");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteStaff(id);
        toast.success("Staff member deleted");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete staff");
      }
    }
  };

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader 
        title="Settings" 
        subtitle="Manage your account and preferences"
      />

      <div className="mx-auto max-w-5xl space-y-8">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[2rem] border border-border bg-white p-8 shadow-sm"
        >
          <div className="mb-8 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              <User className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Profile Information</h2>
              <p className="text-sm text-slate-500">Your personal details and account role</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.full_name || ''}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email <span className="text-[10px] font-normal text-slate-400 font-mono">(Read-only)</span></label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100/50 px-4 py-3 text-slate-400 cursor-not-allowed outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Role</label>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-white shadow-lg">
                  <Shield className="size-4" />
                  <span className="text-xs font-black uppercase tracking-widest">{user?.role}</span>
                </div>
                <p className="text-xs text-slate-400">Permissions are managed by the administrator.</p>
              </div>
            </div>
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl bg-brand-primary px-8 py-3.5 font-bold text-white shadow-xl shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
              >
                Save Profile
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Store Profile Section (Owner Only) */}
        {user?.role === 'owner' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-[2rem] border border-border bg-white p-8 shadow-sm"
          >
            <StoreProfileSection />
          </motion.div>
        )}

        {/* User Management Section (Owner Only) */}
        {user?.role === 'owner' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[2rem] border border-border bg-white p-8 shadow-sm overflow-hidden"
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <UserPlus className="size-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">User Management</h2>
                  <p className="text-sm text-slate-500">Manage staff members and access levels</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddingStaff(true)}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-brand-primary transition-all"
              >
                <UserPlus className="size-4" />
                Add Staff
              </button>
            </div>

            <div className="space-y-4">
              {users.filter(u => u.id !== user.id).map(staffUser => (
                <div key={staffUser.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                      {staffUser.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{staffUser.full_name || 'Unnamed Staff'}</p>
                      <p className="text-xs text-slate-500">{staffUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full">
                      {staffUser.role || 'Staff'}
                    </span>
                    <div className="flex items-center gap-2 mr-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={async () => {
                          try {
                            await toggleActiveStaff(staffUser.id);
                            toast.success(`User ${staffUser.is_active ? 'deactivated' : 'activated'} successfully`);
                          } catch (error: any) {
                            toast.error(error.message || "Failed to update user status");
                          }
                        }}
                        className={`relative h-5 w-9 rounded-full transition-colors ${staffUser.is_active ? 'bg-brand-primary' : 'bg-slate-300'}`}
                      >
                        <motion.div
                          animate={{ x: staffUser.is_active ? 18 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 size-3 rounded-full bg-white shadow-sm"
                        />
                      </motion.button>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {staffUser.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteStaff(staffUser.id, staffUser.full_name || staffUser.email)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}

              {users.filter(u => u.id !== user.id).length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                  No other staff members found.
                </div>
              )}
            </div>

            {/* Add Staff Modal Overlay */}
            <AnimatePresence>
              {isAddingStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-black text-slate-900">New Staff Member</h3>
                      <button onClick={() => setIsAddingStaff(false)} className="p-2 hover:bg-slate-100 rounded-full">
                        <X className="size-6 text-slate-400" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateStaff} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                        <input
                          required
                          type="text"
                          placeholder="Enter name"
                          value={newStaff.full_name}
                          onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                        <input
                          required
                          type="email"
                          placeholder="staff@example.com"
                          value={newStaff.email}
                          onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Initial Password</label>
                        <input
                          required
                          type="password"
                          placeholder="••••••••"
                          value={newStaff.password}
                          onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Permissions Level</label>
                        <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 font-bold">
                          Standard Staff
                        </div>
                        <input type="hidden" value="STAFF" />
                      </div>

                      <button
                        disabled={isSaving}
                        type="submit"
                        className="w-full rounded-2xl bg-slate-900 py-4 font-black text-white shadow-xl hover:bg-brand-primary transition-all disabled:opacity-50"
                      >
                        {isSaving ? 'Creating...' : 'Create Account'}
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Language Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-[2rem] border border-border bg-white p-8 shadow-sm"
        >
          <div className="mb-8 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Globe className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Language & Localization</h2>
              <p className="text-sm text-slate-500">Customize the interface language</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">System Language</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'en', label: 'English', sub: 'Default' },
                  { id: 'km', label: 'Khmer', sub: 'Local' },
                  { id: 'ko', label: 'Korean', sub: 'Regional' }
                ].map(lang => (
                  <div
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-1 ${language === lang.id ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${language === lang.id ? 'text-brand-primary' : 'text-slate-800'}`}>{lang.label}</span>
                      {language === lang.id && <Check className="size-4 text-brand-primary" />}
                    </div>
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{lang.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-[2rem] border border-border bg-white p-8 shadow-sm"
        >
          <div className="mb-8 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <Bell className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Smart Notifications</h2>
              <p className="text-sm text-slate-500">Configure how you want to be notified</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { key: 'email' as const, label: 'Email Notifications', description: 'Receive email updates about critical orders' },
              { key: 'lowStock' as const, label: 'Low Stock Alerts', description: 'Real-time alerts when inventory is critical' },
              { key: 'dailyReport' as const, label: 'Daily Reports', description: 'Automated end-of-day sales summary' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50/30">
                <div>
                  <div className="font-bold text-slate-800">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.description}</div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                  className={`relative h-7 w-12 rounded-full transition-colors ${notifications[item.key] ? 'bg-brand-primary' : 'bg-slate-300'
                    }`}
                >
                  <motion.div
                    animate={{ x: notifications[item.key] ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 size-5 rounded-full bg-white shadow-lg"
                  />
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
