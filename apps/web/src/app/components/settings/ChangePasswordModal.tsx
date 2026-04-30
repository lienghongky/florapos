import React, { useState } from 'react';
import { useAuthStore } from '@/app/store/auth-store';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { changePassword } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setIsSaving(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast.success("Password updated successfully");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to change password. Check your current password.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Decoration */}
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-brand-primary/5" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <Lock className="size-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="size-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    required
                    type="password"
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3.5 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    required
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3.5 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Confirm New Password</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    required
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3.5 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  disabled={isSaving}
                  type="submit"
                  className="w-full rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-xl hover:bg-brand-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? 'Updating...' : (
                    <>
                      <Lock className="size-4" />
                      Update Password
                    </>
                  )}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <AlertCircle className="size-3" />
                  You will remain logged in after changing your password.
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
