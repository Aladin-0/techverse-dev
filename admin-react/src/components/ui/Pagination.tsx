import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  preserveParams?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buttonBase =
    'flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {/* First */}
      <button
        className={buttonBase}
        style={{
          background: '#1a1a26',
          color: '#8b8a9a',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(1)}
        title="First page"
      >
        <ChevronsLeft size={16} />
      </button>

      {/* Previous */}
      <button
        className={buttonBase}
        style={{
          background: '#1a1a26',
          color: '#8b8a9a',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        title="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page indicator */}
      <span
        className="px-4 py-2 text-sm font-medium rounded-lg"
        style={{
          background: 'rgba(124,58,237,0.1)',
          color: '#a78bfa',
          border: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        Page {currentPage} of {totalPages}
      </span>

      {/* Next */}
      <button
        className={buttonBase}
        style={{
          background: '#1a1a26',
          color: '#8b8a9a',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        title="Next page"
      >
        <ChevronRight size={16} />
      </button>

      {/* Last */}
      <button
        className={buttonBase}
        style={{
          background: '#1a1a26',
          color: '#8b8a9a',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(totalPages)}
        title="Last page"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
}
