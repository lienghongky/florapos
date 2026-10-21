import { motion, AnimatePresence } from 'motion/react';
import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedPage({ children, className = '' }: AnimatedPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedModal({ 
  children, 
  isOpen, 
  onClose,
  position = 'bottom',
  closeOnClickOutside = true,
}: { 
  children: ReactNode; 
  isOpen: boolean;
  onClose?: () => void;
  position?: 'center' | 'bottom';
  closeOnClickOutside?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          data-scanner-pause
          className={`fixed inset-0 z-[99999] flex ${position === 'center' ? 'items-center' : 'items-end lg:items-center'} justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm pointer-events-auto`}
          onClick={closeOnClickOutside ? onClose : undefined}
        >
          <motion.div
            initial={position === 'center' ? { scale: 0.95, opacity: 0, y: 10 } : { y: '100%', opacity: 0 }}
            animate={position === 'center' ? { scale: 1, opacity: 1, y: 0 } : { y: 0, opacity: 1 }}
            exit={position === 'center' ? { scale: 0.95, opacity: 0, y: 10 } : { y: '100%', opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}