import { Search, Filter, X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDef {
  name: string;
  label: string;
  options: FilterOption[];
  value: string;
}

interface FilterBarProps {
  filters: FilterDef[];
  searchValue?: string;
  searchPlaceholder?: string;
  onFilterChange: (name: string, value: string) => void;
  onSearchChange?: (value: string) => void;
  onClear: () => void;
  showClear?: boolean;
}

const inputStyle = {
  background: '#1a1a26',
  borderColor: 'rgba(255,255,255,0.07)',
  color: '#f1f0f5',
};

export default function FilterBar({
  filters,
  searchValue = '',
  searchPlaceholder = 'Search...',
  onFilterChange,
  onSearchChange,
  onClear,
  showClear = true,
}: FilterBarProps) {
  const hasActiveFilters =
    filters.some((f) => f.value !== '') || searchValue !== '';

  return (
    <div
      className="flex flex-wrap items-center gap-3 p-4 rounded-xl border mb-6"
      style={{
        background: '#12121a',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      {/* Search */}
      {onSearchChange && (
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#4a4960' }}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border outline-none transition-colors focus:border-[#7c3aed]"
            style={inputStyle}
          />
        </div>
      )}

      {/* Filter selects */}
      {filters.map((filter) => (
        <select
          key={filter.name}
          value={filter.value}
          onChange={(e) => onFilterChange(filter.name, e.target.value)}
          className="px-4 py-2.5 text-sm rounded-lg border outline-none cursor-pointer transition-colors focus:border-[#7c3aed] appearance-none min-w-[140px]"
          style={inputStyle}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {/* Filter indicator */}
      <div
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm"
        style={{
          background: 'rgba(124,58,237,0.1)',
          color: '#a78bfa',
        }}
      >
        <Filter size={14} />
        <span className="font-medium">Filter</span>
      </div>

      {/* Clear button */}
      {showClear && hasActiveFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
          style={{ color: '#8b8a9a' }}
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
