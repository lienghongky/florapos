import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';
import { UserRole } from '@/app/types';
import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flower2, AlertCircle, Sparkles, Zap, Gem, ArrowRight, ChevronDown } from 'lucide-react';
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

  const plans = [
    { 
      name: 'Starter', 
      price: '10', 
      icon: <Zap className="size-6 text-orange-500" />, 
      features: ['1 Store', 'Unlimited Orders', 'Basic Reports'],
      color: 'border-orange-100 bg-orange-50/30'
    },
    { 
      name: 'Pro', 
      price: '20', 
      icon: <Sparkles className="size-6 text-brand-primary" />, 
      features: ['2 Stores', 'Staff Roles', 'Telegram Alerts'],
      popular: true,
      color: 'border-brand-primary/20 bg-brand-primary/5 shadow-xl shadow-brand-primary/5'
    },
    { 
      name: 'Elite', 
      price: '49', 
      icon: <Gem className="size-6 text-blue-500" />, 
      features: ['5 Stores', 'Custom Domain', 'Priority Support'],
      color: 'border-blue-100 bg-blue-50/30'
    },
  ];

  return (
    <AnimatedPage className="min-h-screen bg-white flex flex-col selection:bg-brand-primary/20">
      
      {/* 1. Branding Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-white/80 backdrop-blur-md border-b border-slate-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
            <Flower2 className="size-5" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">FloraPos</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/features" className="hidden md:block text-sm font-bold text-slate-500 hover:text-brand-primary transition-colors">Features</Link>
          <Link to="/pricing" className="hidden md:block text-sm font-bold text-slate-500 hover:text-brand-primary transition-colors">Pricing</Link>
          <Button 
            onClick={() => navigate('/register')}
            variant="outline" 
            className="h-10 rounded-full border-slate-200 text-slate-900 font-bold px-6"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* 2. Hero Section + Login Card */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-24 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-brand-primary/5 blur-[120px]" />
          <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-[1200px] px-6 flex flex-col-reverse lg:grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <Sparkles className="size-3 text-brand-primary" />
              The Future of POS
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1] tracking-tight">
              Manage your <br />
              business with <br />
              <span className="text-brand-primary">pure elegance.</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-500 leading-relaxed max-w-lg mx-auto lg:mx-0">
              FloraPos simplifies your operations, automates your growth, and lets you focus on what matters most—your customers.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 shadow-xl shadow-slate-900/10"
              >
                Explore Features
              </Button>
            </div>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-[480px] mx-auto"
          >
            <div className="bg-white/70 backdrop-blur-3xl rounded-[48px] shadow-[0_48px_100px_-24px_rgba(0,0,0,0.12)] border border-white p-10 lg:p-14">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Dashboard</h2>
                <p className="text-slate-400 mt-2 font-medium">Sign in to manage your business operations</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-2xl bg-red-50 border border-red-100 p-4 text-[11px] font-bold text-red-600 flex items-center gap-3 uppercase tracking-wider"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-14 rounded-2xl border border-slate-100 bg-white px-5 text-sm outline-none transition-all focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                    <Link to="/forgot-password" title="Forgot Password" className="text-[11px] font-bold text-brand-primary hover:underline uppercase tracking-wider">Reset</Link>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 rounded-2xl border border-slate-100 bg-white px-5 text-sm outline-none transition-all focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/20"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-xl shadow-brand-primary/20 transition-all mt-4 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="size-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Enter Dashboard</span>
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                <p className="text-sm text-slate-400 font-medium">
                  Don't have an account? <Link to="/register" title="Register" className="font-bold text-brand-primary hover:underline">Register Now</Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Explore Plans</span>
          <ChevronDown className="size-4 text-slate-300" />
        </motion.div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="w-full max-w-[1200px] px-6 mx-auto">
          <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-8">
            <div className="space-y-4 max-w-2xl text-center lg:text-left">
              <p className="text-[11px] font-black text-brand-primary uppercase tracking-[0.3em]">Powerful Features</p>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Everything you need to <br className="hidden lg:block" />
                run your <span className="text-brand-primary">empire.</span>
              </h2>
            </div>
            <p className="text-slate-500 text-lg max-w-sm text-center lg:text-left">
              Meticulously designed features that help you scale without the headache of traditional POS systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Smart Inventory',
                desc: 'Track stock across multiple stores with automatic low-stock alerts.',
                icon: <Zap className="size-6 text-orange-500" />,
              },
              {
                title: 'Advanced Analytics',
                desc: 'Deep insights into your sales trends, top products, and staff performance.',
                icon: <Sparkles className="size-6 text-brand-primary" />,
              },
              {
                title: 'Telegram Alerts',
                desc: 'Stay informed with instant order notifications directly to your phone.',
                icon: <ArrowRight className="size-6 text-blue-500" />,
              },
              {
                title: 'Digital E-Menu',
                desc: 'Let your customers scan and order from a beautiful, customizable digital menu.',
                icon: <Flower2 className="size-6 text-emerald-500" />,
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-brand-primary/20 hover:bg-white transition-all group"
              >
                <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Cool Plans Section */}
      <section id="plans" className="py-32 bg-slate-50/50 border-t border-slate-100 flex flex-col items-center">
        <div className="w-full max-w-[1200px] px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Choose Your Path to Success</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Simple, transparent pricing that grows with your business. No hidden fees, just pure value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`group relative p-10 rounded-[40px] border transition-all hover:scale-[1.02] ${plan.color}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-10 px-4 py-1.5 bg-brand-primary text-[10px] font-black text-white rounded-full uppercase tracking-widest shadow-lg">
                    Recommended
                  </div>
                )}
                
                <div className="size-14 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-8 group-hover:scale-110 transition-transform">
                  {plan.icon}
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                  <span className="text-slate-400 font-medium">/mo</span>
                </div>

                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <div className="size-5 rounded-full bg-white flex items-center justify-center border border-slate-100">
                        <div className="size-1.5 rounded-full bg-brand-primary" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={() => navigate('/register')}
                  variant={plan.popular ? 'default' : 'outline'}
                  className={`w-full h-12 rounded-xl font-bold transition-all ${plan.popular ? 'bg-brand-primary hover:bg-brand-primary/90 text-white' : 'border-slate-200 text-slate-900 hover:bg-white'}`}
                >
                  Choose {plan.name}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-slate-50 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Flower2 className="size-5 text-slate-300" />
          <span className="text-sm font-bold text-slate-400">© 2026 FloraPos. All rights reserved.</span>
        </div>
      </footer>
    </AnimatedPage>
  );
}
