'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, RotateCcw, BarChart2, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/vocabulary', icon: BookOpen, label: 'Words' },
  { href: '/review', icon: RotateCcw, label: 'Review' },
  { href: '/conversation', icon: MessageCircle, label: 'Chat' },
  { href: '/stats', icon: BarChart2, label: 'Stats' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl safe-area-pb">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 pt-3 gap-0.5 transition-colors duration-200 relative',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              )}
              aria-label={label}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className={cn('text-[10px] font-medium', isActive ? 'font-semibold' : '')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
