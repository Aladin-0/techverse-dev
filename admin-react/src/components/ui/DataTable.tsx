import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { InboxIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  width?: string;
}

interface DataTableProps<T> {
  title: string;
  count?: number;
  columns: Column[];
  data: T[];
  renderRow: (item: T, index: number) => ReactNode;
  actions?: ReactNode;
  emptyIcon?: LucideIcon;
  emptyMessage?: string;
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function DataTable<T>({
  title,
  count,
  columns,
  data,
  renderRow,
  actions,
  emptyIcon: EmptyIcon = InboxIcon,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: '#12121a',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold" style={{ color: '#f1f0f5' }}>
            {title}
          </h3>
          {count !== undefined && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(124,58,237,0.15)',
                color: '#a78bfa',
              }}
            >
              {count}
            </span>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className="border-b"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: '#4a4960',
                    width: col.width,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <EmptyIcon size={48} style={{ color: '#4a4960' }} />
                    <p className="text-sm" style={{ color: '#8b8a9a' }}>
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <motion.tr
                  key={index}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.03, duration: 0.25 }}
                  className="border-b transition-colors hover:bg-white/[0.02]"
                  style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                >
                  {renderRow(item, index)}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
