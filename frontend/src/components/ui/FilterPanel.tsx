import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterPanelProps {
  selectedSegment: number | null;
  onSelectSegment: (segmentId: number | null) => void;
  selectedGenre: string | null;
  onSelectGenre: (genre: string | null) => void;
  sortBy: string;
  onSelectSortBy: (field: string) => void;
  sortDesc: boolean;
  onToggleSortDesc: () => void;
  onClearFilters: () => void;
  genres: string[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedSegment,
  onSelectSegment,
  selectedGenre,
  onSelectGenre,
  sortBy,
  onSelectSortBy,
  sortDesc,
  onToggleSortDesc,
  onClearFilters,
  genres,
}) => {
  const hasActiveFilters = selectedSegment !== null || selectedGenre !== null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Segment Filter */}
      <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
        <Filter className="w-3.5 h-3.5 text-stone-400" />
        <span className="text-[11px] font-semibold text-stone-500">Segment:</span>
        <select
          value={selectedSegment === null ? '' : String(selectedSegment)}
          onChange={(e) => onSelectSegment(e.target.value === '' ? null : Number(e.target.value))}
          className="text-xs font-medium text-stone-800 bg-transparent outline-none cursor-pointer"
        >
          <option value="">All 5 Segments</option>
          <option value="0">Segment 0: Action/Sci-Fi Power</option>
          <option value="1">Segment 1: Casual Weekend</option>
          <option value="2">Segment 2: Genre Explorers</option>
          <option value="3">Segment 3: Focused Drama</option>
          <option value="4">Segment 4: Family & Animation</option>
        </select>
      </div>

      {/* Genre Filter */}
      <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
        <span className="text-[11px] font-semibold text-stone-500">Genre:</span>
        <select
          value={selectedGenre || ''}
          onChange={(e) => onSelectGenre(e.target.value === '' ? null : e.target.value)}
          className="text-xs font-medium text-stone-800 bg-transparent outline-none cursor-pointer"
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Sort By Filter */}
      <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
        <span className="text-[11px] font-semibold text-stone-500">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => onSelectSortBy(e.target.value)}
          className="text-xs font-medium text-stone-800 bg-transparent outline-none cursor-pointer"
        >
          <option value="user_id">User ID</option>
          <option value="watch_time_hours">Watch Time</option>
          <option value="avg_session_mins">Avg Session</option>
          <option value="sessions_per_week">Sessions / Week</option>
          <option value="completion_rate">Completion Rate</option>
          <option value="distance_to_centroid">Centroid Distance</option>
        </select>
        <button
          onClick={onToggleSortDesc}
          className="text-[10px] font-bold text-brand-800 uppercase px-1 rounded hover:bg-stone-100"
          title="Toggle Ascending / Descending"
        >
          {sortDesc ? 'DESC' : 'ASC'}
        </button>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 px-2 py-1 rounded hover:bg-stone-100 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
