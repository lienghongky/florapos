import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';
import { UserRole } from '@/app/types';
import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flower2 } from 'lucide-react';
export function LoginPage() {
  const { login, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      // login success, navigation happens here or via initAuth in App.tsx but let's be explicit
      const user = useAuthStore.getState().user;
      if (user) {
        const roleLower = user.role.toLowerCase();
        if (roleLower === UserRole.MASTER.toLowerCase()) navigate('/dashboard-master');
        else if (roleLower === UserRole.OWNER.toLowerCase()) navigate('/dashboard-owner');
        else navigate('/dashboard-sales');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedPage className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-accent via-white to-brand-secondary/10 p-4">
      {/* Background decorative elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-brand-secondary/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative w-full max-w-md"
      >
        {/* Branding */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-xl shadow-brand-primary/30"
          >
            <Flower2 className="size-8" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">FloraPos</h1>
          <p className="mt-2 text-sm text-muted-foreground">Flower Shop Management System</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="rounded-2xl border border-border/60 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-black/5"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <motion.input
                whileFocus={{ boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.15)' }}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-brand-primary/40"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
              <motion.input
                whileFocus={{ boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.15)' }}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-brand-primary/40"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01, boxShadow: '0 12px 30px -8px rgba(16, 185, 129, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-brand-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/25 transition-all disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-brand-primary hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-muted-foreground/60">
          © {new Date().getFullYear()} FloraPos · All rights reserved
        </p>
      </motion.div>
    </AnimatedPage>
  );
}
