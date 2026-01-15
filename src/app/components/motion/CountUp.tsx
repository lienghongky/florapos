import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUp({ value, duration = 1, prefix = '', suffix = '', decimals = 0 }: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Ease out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(value * easeOut);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <motion.span>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </motion.span>
  );
}
