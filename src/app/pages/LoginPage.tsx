import { useState } from 'react';
import { motion } from 'motion/react';
import { Flower2 } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { AnimatedPage } from '@/app/components/motion/AnimatedPage';

export function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState('owner@florapos.com');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
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
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Flower2 className="size-8" />
          </div>
          <h1 className="text-3xl font-semibold">FloraPos</h1>
          <p className="mt-2 text-sm text-muted-foreground">Flower Shop Management System</p>
        </div>

        <motion.div
          whileHover={{ boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)' }}
          className="rounded-2xl border border-border bg-white p-8 shadow-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <motion.label
                animate={{
                  y: focusedField === 'email' || email ? -24 : 0,
                  scale: focusedField === 'email' || email ? 0.85 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
              >
                Email address
              </motion.label>
              <motion.input
                whileFocus={{ boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)' }}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="w-full rounded-lg border border-border bg-white px-3 py-3 outline-none transition-shadow"
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
                Password
              </motion.label>
              <motion.input
                whileFocus={{ boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)' }}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className="w-full rounded-lg border border-border bg-white px-3 py-3 outline-none transition-shadow"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground shadow-md"
            >
              Sign In
            </motion.button>
          </form>

          <div className="mt-6 space-y-2 text-center text-xs text-muted-foreground">
            <p>Demo accounts:</p>
            <p>Owner: owner@florapos.com</p>
            <p>Sales: sales@florapos.com</p>
            <p>(any password works)</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatedPage>
  );
}
