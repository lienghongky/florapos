import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';
import { UserRole } from '@/app/types';
import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, AlertCircle, Sparkles, Zap, Gem, ArrowRight, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useTranslation } from '@/app/i18n';

export function LoginPage() {
  const { login, user } = useAuthStore();
  const { t, language, setLanguage } = useTranslation();
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
      price: '0',
      period: 'Free for 1 Year',
      subtext: 'then $10/mo afterwards',
      badge: '1 Year Free',
      icon: <Zap className="size-6 text-emerald-500" />,
      features: ['1 Store', 'Unlimited Orders', 'Basic Reports'],
      color: 'border-emerald-200 bg-emerald-50/40 shadow-sm'
    },
    {
      name: 'Pro',
      price: '20',
      period: '/mo',
      icon: <Sparkles className="size-6 text-brand-primary" />,
      features: ['2 Stores', 'Staff Roles', 'Telegram Alerts'],
      popular: true,
      color: 'border-brand-primary/20 bg-brand-primary/5 shadow-xl shadow-brand-primary/5'
    },
    {
      name: 'Elite',
      price: '49',
      period: '/mo',
      icon: <Gem className="size-6 text-blue-500" />,
      features: ['5 Stores', 'Custom Domain', 'Priority Support'],
      color: 'border-blue-100 bg-blue-50/30'
    },
  ];

  return (
    <AnimatedPage className="min-h-screen bg-white flex flex-col selection:bg-brand-primary/20">

      {/* 1. Branding Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-[#061a14]/85 backdrop-blur-md border-b border-emerald-900/40 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Ottor POS"
            className="size-11 rounded-2xl object-contain shadow-lg shadow-emerald-500/20 shrink-0 hover:scale-105 transition-transform"
          />
          <span className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            Ottor POS
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-200">
            <Globe className="size-3.5 text-emerald-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-emerald-200 outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">English (EN)</option>
              <option value="km" className="bg-slate-900 text-white">ភាសាខ្មែរ (KM)</option>
              <option value="ko" className="bg-slate-900 text-white">한국어 (KO)</option>
            </select>
          </div>
          <Button
            onClick={() => navigate('/register')}
            variant="outline"
            className="h-10 rounded-full border-emerald-500/40 text-emerald-100 hover:bg-emerald-900/30 hover:text-white font-bold px-6 text-xs uppercase tracking-wider"
          >
            {t('auth.registerNow')}
          </Button>
        </div>
      </header>

      {/* 2. Hero Section with 3D Emerald Background + Floating Login Card */}
      <section className="relative min-h-screen bg-[#061a14] text-white flex flex-col justify-center pt-24 pb-16 overflow-hidden">
        {/* Background Image: Discord-Style 3D Emerald Artwork */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <img
            src="/assets/hero_pos_emerald.jpg"
            alt="Hero Background"
            className="w-full h-full object-cover object-right lg:object-center brightness-105 contrast-105"
          />
          {/* Soft directional gradient to protect text legibility while keeping the 3D art fully vibrant */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#061a14]/85 via-[#061a14]/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#061a14] via-[#061a14]/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1240px] px-6 mx-auto flex flex-col-reverse lg:grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">

          {/* Hero Content (Left) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-emerald-400/40 text-[11px] font-black text-emerald-300 uppercase tracking-widest shadow-lg backdrop-blur-md">
              <Sparkles className="size-3 text-emerald-400" />
              {t('auth.futureOfPos')}
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-[66px] font-black text-white leading-[1.03] tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              SMART POS <br />
              <span className="text-emerald-400 drop-shadow-[0_4px_24px_rgba(16,185,129,0.5)]">THAT'S ALL ABOUT</span> <br />
              BUSINESS
            </h1>
            <p className="text-base sm:text-lg text-emerald-50/90 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {t('auth.heroSubtitle')}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12 rounded-2xl bg-white hover:bg-emerald-50 text-slate-950 font-black px-7 shadow-2xl shadow-black/40 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                {t('auth.exploreFeatures')}
              </Button>
            </div>
          </motion.div>

          {/* Floating Login Card (Right - a bit smaller like before) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="lg:col-span-5 w-full max-w-[400px] mx-auto"
          >
            <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.5)] border border-white/60 p-7 sm:p-9 text-slate-900">
              <div className="mb-6 text-center space-y-1">
                <div className="inline-flex items-center justify-center size-10 rounded-xl bg-brand-primary/10 text-brand-primary mb-1">
                  <Sparkles className="size-5" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('auth.accessDashboard')}</h2>
                <p className="text-slate-400 text-xs font-medium">{t('auth.loginSubtitle')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-xl bg-red-50 border border-red-100 p-3 text-[11px] font-bold text-red-600 flex items-center gap-2.5 uppercase tracking-wider"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.emailAddress')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs font-semibold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/40 text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('auth.password')}</label>
                    <Link to="/forgot-password" title="Forgot Password" className="text-[10px] font-bold text-brand-primary hover:underline uppercase tracking-wider">{t('auth.resetPassword')}</Link>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs font-semibold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/40 text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-primary/25 transition-all mt-2 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="size-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>{t('auth.signingIn')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>{t('auth.enterDashboard')}</span>
                      <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-medium">
                  {t('auth.dontHaveAccount')} <Link to="/register" title="Register" className="font-bold text-brand-primary hover:underline">{t('auth.registerNow')}</Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer z-10 text-emerald-400/80 hover:text-emerald-300"
          onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">{t('auth.explorePlans')}</span>
          <ChevronDown className="size-3.5" />
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
                icon: <QrCode className="size-6 text-emerald-500" />,
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
                {plan.badge && (
                  <div className="absolute -top-4 left-10 px-4 py-1.5 bg-emerald-600 text-[10px] font-black text-white rounded-full uppercase tracking-widest shadow-lg shadow-emerald-600/20">
                    {plan.badge}
                  </div>
                )}
                {plan.popular && (
                  <div className="absolute -top-4 left-10 px-4 py-1.5 bg-brand-primary text-[10px] font-black text-white rounded-full uppercase tracking-widest shadow-lg">
                    Recommended
                  </div>
                )}

                <div className="size-14 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-8 group-hover:scale-110 transition-transform">
                  {plan.icon}
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                <div className="mb-8 min-h-[52px]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                    <span className={`font-semibold ${plan.price === '0' ? 'text-emerald-600 text-sm font-bold' : 'text-slate-400'}`}>
                      {plan.period}
                    </span>
                  </div>
                  {plan.subtext && (
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      {plan.subtext}
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <div className="size-5 rounded-full bg-white flex items-center justify-center border border-slate-100">
                        <div className={`size-1.5 rounded-full ${plan.price === '0' ? 'bg-emerald-500' : 'bg-brand-primary'}`} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate('/register')}
                  variant={plan.popular ? 'default' : 'outline'}
                  className={`w-full h-12 rounded-xl font-bold transition-all ${plan.popular
                    ? 'bg-brand-primary hover:bg-brand-primary/90 text-white shadow-md shadow-brand-primary/20'
                    : plan.price === '0'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-md shadow-emerald-600/20'
                      : 'border-slate-200 text-slate-900 hover:bg-white'
                    }`}
                >
                  {plan.price === '0' ? 'Claim 1 Year Free' : `Choose ${plan.name}`}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-slate-50 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src="/logo.png" alt="Ottor POS" className="size-6 object-contain" />
          <span className="text-sm font-bold text-slate-400">© 2026 Ottor POS. All rights reserved.</span>
        </div>
      </footer>
    </AnimatedPage>
  );
}
