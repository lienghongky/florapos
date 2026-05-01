import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';
import { UserRole } from '@/app/types';
import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flower2, Shield, AlertCircle, Check, Sparkles, Zap, Gem } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
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
    <AnimatedPage className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Premium Plan Showcase */}
      <div className="hidden md:flex md:w-[60%] lg:w-[65%] relative bg-slate-900 flex-col justify-center p-12 lg:p-24 overflow-hidden">
        {/* Advanced Background Design */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-brand-primary/20 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
        
        <div className="relative z-10 w-full max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-16"
          >
            <div className="size-12 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-2xl shadow-brand-primary/50">
              <Flower2 className="size-6" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">FloraPos <span className="text-brand-primary">Elite</span></span>
          </motion.div>

          <div className="max-w-2xl mb-20">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-6"
            >
              <Sparkles className="size-3" />
              Scale your empire
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]"
            >
              Simplify orders, sales, and growth—<span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-emerald-400">one platform.</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
            {[
              { 
                name: 'Starter', 
                price: '10', 
                stores: '1 Store', 
                users: '1 User',
                icon: <Zap className="size-5" />,
                features: ['Unlimited Orders', 'Basic Reports', 'Email Support'],
                theme: 'from-slate-800 to-slate-900 border-white/5'
              },
              { 
                name: 'Pro', 
                price: '20', 
                stores: '2 Stores', 
                users: '3 Users',
                icon: <Sparkles className="size-5" />,
                popular: true,
                features: ['Telegram Alerts', 'Staff Roles', 'Advanced Analytics'],
                theme: 'from-brand-primary/20 to-slate-900 border-brand-primary/30 shadow-2xl shadow-brand-primary/20'
              },
              { 
                name: 'Elite', 
                price: '49', 
                stores: '5 Stores', 
                users: '10 Users',
                icon: <Gem className="size-5" />,
                features: ['Custom Domain', 'API Access', 'Priority 24/7'],
                theme: 'from-amber-500/10 to-slate-900 border-amber-500/20'
              }
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.1), duration: 0.6 }}
                className={`group relative p-8 rounded-[32px] border bg-gradient-to-b ${plan.theme} transition-all hover:translate-y-[-8px] hover:shadow-2xl`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-8 px-4 py-1.5 bg-brand-primary text-[10px] font-black text-white rounded-full uppercase tracking-widest shadow-lg">
                    Best Value
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-8">
                  <div className={`size-12 rounded-2xl flex items-center justify-center text-white bg-white/5 border border-white/10 group-hover:scale-110 transition-transform`}>
                    {plan.icon}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Starting at</p>
                    <p className="text-2xl font-black text-white">${plan.price}<span className="text-xs text-slate-500 font-medium">/mo</span></p>
                  </div>
                </div>

                <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                <div className="flex items-center gap-3 mb-8">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{plan.stores}</p>
                  <div className="size-1 rounded-full bg-slate-700" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{plan.users}</p>
                </div>

                <ul className="space-y-4 border-t border-white/5 pt-8">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-center gap-3 text-xs font-bold text-slate-400">
                      <div className="size-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Floating Login Card */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative">
        {/* Subtle background blurs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-brand-primary/5 blur-[100px]" />
          <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          <div className="md:hidden flex flex-col items-center mb-10 text-center">
            <div className="size-12 rounded-xl bg-brand-primary flex items-center justify-center text-white mb-4">
              <Flower2 className="size-6" />
            </div>
            <h1 className="text-xl font-black text-slate-900">FloraPos</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-white p-10"
          >
            <div className="mb-8 text-center md:text-left">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Login</h3>
              <p className="text-slate-400 text-sm mt-1">Welcome back, please enter your details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-red-50 border border-red-100 p-4 text-[10px] font-bold text-red-600 flex items-center gap-3 uppercase tracking-wider"
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@florapos.com"
                  className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50/50 px-5 text-sm outline-none transition-all focus:bg-white focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" title="Forgot Password" className="text-[10px] font-bold text-brand-primary hover:underline uppercase tracking-wider">Reset</Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50/50 px-5 text-sm outline-none transition-all focus:bg-white focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-xl shadow-brand-primary/10 transition-all mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Authorizing...</span>
                  </div>
                ) : (
                  'Enter Dashboard'
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                Need an account? <Link to="/register" title="Register" className="font-bold text-brand-primary hover:underline">Register</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
}
