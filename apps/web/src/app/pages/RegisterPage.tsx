import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';
import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/app/i18n';

export function RegisterPage() {
    const { t } = useTranslation();
    const { register, user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setIsLoading(true);
        try {
            await register({ email, password, full_name: fullName, role: 'OWNER' });
            setSuccess('Registration successful! Redirecting to login...');
            // Optional: Redirect to login after delay
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatedPage className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-muted/30 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="w-full max-w-md"
            >
                <div className="mb-8 text-center">
                    <Link
                        to="/login"
                        className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                        <ArrowLeft className="size-6" />
                    </Link>
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 p-2 shadow-sm border border-emerald-500/20">
                        <img src="/logo.png" alt="Ottor POS" className="size-12 object-contain" />
                    </div>
                    <h1 className="text-3xl font-semibold">{t('auth.joinTitle')}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">{t('auth.createAccount')}</p>
                </div>

                <motion.div
                    whileHover={{ boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)' }}
                    className="rounded-2xl border border-border bg-white p-8 shadow-lg"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}
                        {success && <div className="p-3 text-sm text-green-500 bg-green-50 rounded-lg">{success}</div>}

                        <div className="relative">
                            <motion.label
                                animate={{
                                    y: focusedField === 'fullName' || fullName ? -24 : 0,
                                    scale: focusedField === 'fullName' || fullName ? 0.85 : 1,
                                }}
                                transition={{ duration: 0.2 }}
                                className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
                            >
                                {t('auth.fullName')}
                            </motion.label>
                            <motion.input
                                whileFocus={{ boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)' }}
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                onFocus={() => setFocusedField('fullName')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full rounded-lg border border-border bg-white px-3 py-3 outline-none transition-shadow"
                                required
                            />
                        </div>

                        <div className="relative">
                            <motion.label
                                animate={{
                                    y: focusedField === 'email' || email ? -24 : 0,
                                    scale: focusedField === 'email' || email ? 0.85 : 1,
                                }}
                                transition={{ duration: 0.2 }}
                                className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
                            >
                                {t('auth.emailAddress')}
                            </motion.label>
                            <motion.input
                                whileFocus={{ boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)' }}
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full rounded-lg border border-border bg-white px-3 py-3 outline-none transition-shadow"
                                required
                            />
                        </div>

                        <div className="relative">
                            <motion.label
                                animate={{
                                    y: focusedField === 'password' || password ? -24 : 0,
                                    scale: focusedField === 'password' || password ? 0.85 : 1,
                                }}
                                transition={{ duration: 0.2 }}
                                className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
                            >
                                {t('auth.password')}
                            </motion.label>
                            <motion.input
                                whileFocus={{ boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)' }}
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full rounded-lg border border-border bg-white px-3 py-3 outline-none transition-shadow"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="relative">
                            <motion.label
                                animate={{
                                    y: focusedField === 'confirmPassword' || confirmPassword ? -24 : 0,
                                    scale: focusedField === 'confirmPassword' || confirmPassword ? 0.85 : 1,
                                }}
                                transition={{ duration: 0.2 }}
                                className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
                            >
                                {t('auth.confirmPassword')}
                            </motion.label>
                            <motion.input
                                whileFocus={{ boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)' }}
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                onFocus={() => setFocusedField('confirmPassword')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full rounded-lg border border-border bg-white px-3 py-3 outline-none transition-shadow"
                                required
                                minLength={6}
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground shadow-md disabled:opacity-70"
                        >
                            {isLoading ? t('auth.creatingAccount') : t('auth.signUp')}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        {t('auth.alreadyHaveAccount')}{' '}
                        <Link to="/login" className="font-medium text-primary hover:underline">
                            {t('auth.signIn')}
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatedPage>
    );
}
