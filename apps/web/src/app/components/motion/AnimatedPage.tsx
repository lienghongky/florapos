import { motion, AnimatePresence } from 'motion/react';
import { ReactNode, useEffect } from 'react';

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
  position = 'bottom'
}: { 
  children: ReactNode; 
  isOpen: boolean;
  onClose?: () => void;
  position?: 'center' | 'bottom';
}) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`fixed inset-0 z-50 flex ${position === 'center' ? 'items-center' : 'items-end lg:items-center'} justify-center bg-black/50 p-0 lg:p-4 overflow-y-auto`}
          onClick={onClose}
        >
          <motion.div
            initial={position === 'center' ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
            animate={position === 'center' ? { scale: 1, opacity: 1 } : { y: 0, opacity: 1 }}
            exit={position === 'center' ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}