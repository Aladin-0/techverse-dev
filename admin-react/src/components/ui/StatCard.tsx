import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

function useCountUp(target: number, duration = 1200): number {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (isNaN(target) || target === 0) {
      setCurrent(target);
      return;
    }

    const steps = 40;
    const stepDuration = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));

      if (step >= steps) {
        setCurrent(target);
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [target, duration]);

  return current;
}

const changeColors: Record<string, string> = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#8b8a9a',
};

const ChangeIcon: Record<string, LucideIcon> = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  change,
  changeType = 'neutral',
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : parseInt(value, 10);
  const isNumeric = !isNaN(numericValue);
  const animatedValue = useCountUp(isNumeric ? numericValue : 0);
  const ChangeIconComponent = ChangeIcon[changeType];
  const changeColor = changeColors[changeType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -5,
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        borderColor: 'rgba(255,255,255,0.12)',
      }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border p-5 cursor-default"
      style={{
        background: '#12121a',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: iconBg }}
        >
          <Icon size={22} style={{ color: iconColor }} />
        </div>
        {change && (
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: changeColor }}>
            <ChangeIconComponent size={14} />
            {change}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: '#f1f0f5' }}>
        {isNumeric ? animatedValue.toLocaleString() : value}
      </div>
      <div className="text-sm" style={{ color: '#8b8a9a' }}>
        {title}
      </div>
    </motion.div>
  );
}
