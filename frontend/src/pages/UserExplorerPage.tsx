import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { UserRecord, BatchSummary } from '../types';
import { DataTable } from '../components/ui/DataTable';
import { SearchInput } from '../components/ui/SearchInput';
import { FilterPanel } from '../components/ui/FilterPanel';
import { ExportMenu } from '../components/ui/ExportMenu';
import { UserDetailDrawer } from '../components/ui/UserDetailDrawer';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui/FeedbackStates';

interface UserExplorerPageProps {
  activeBatch: BatchSummary | null;
  initialSegmentFilter?: number | null;
  onNavigateToImport: () => void;
}

export const UserExplorerPage: React.FC<UserExplorerPageProps> = ({
  activeBatch,
  initialSegmentFilter = null,
  onNavigateToImport,
}) => {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(initialSegmentFilter);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('user_id');
  const [sortDesc, setSortDesc] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [totalMatched, setTotalMatched] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inspectUser, setInspectUser] = useState<UserRecord | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync initialSegmentFilter if prop changes
  useEffect(() => {
    if (initialSegmentFilter !== undefined) {
      setSelectedSegment(initialSegmentFilter);
      setPage(1);
    }
  }, [initialSegmentFilter]);

  // Fetch users when batch or filters change
  const fetchUsers = async () => {
    if (!activeBatch) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getBatchDetails(activeBatch.batch_id, {
        segment_id: selectedSegment,
        genre: selectedGenre,
        search: debouncedSearch,
        sort_by: sortBy,
        sort_desc: sortDesc,
        page,
        page_size: pageSize,
      });
      setUsers(res.users);
      setTotalMatched(res.total_matched);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || 'Failed to load user records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeBatch, selectedSegment, selectedGenre, debouncedSearch, sortBy, sortDesc, page, pageSize]);

  if (!activeBatch) {
    return (
      <EmptyState
        title="No Audience Batch Selected"
        description="Select an active batch from the top bar or import a new CSV to explore segmented viewers."
        actionText="Import Audience CSV"
        onAction={onNavigateToImport}
      />
    );
  }

  const segmentTabs = [
    { id: null, label: 'All Viewers', count: activeBatch.processed_rows },
    {
      id: 0,
      label: 'Heavy Action & Sci-Fi Power',
      count: activeBatch.segment_counts['0'] || 0,
    },
    {
      id: 1,
      label: 'Casual Weekend Viewers',
      count: activeBatch.segment_counts['1'] || 0,
    },
    {
      id: 2,
      label: 'Genre Explorers',
      count: activeBatch.segment_counts['2'] || 0,
    },
    {
      id: 3,
      label: 'Focused Drama & Story',
      count: activeBatch.segment_counts['3'] || 0,
    },
    {
      id: 4,
      label: 'Family & Animation',
      count: activeBatch.segment_counts['4'] || 0,
    },
  ];

  const genres = [
    'Action',
    'Animation',
    'Comedy',
    'Documentary',
    'Drama',
    'Family',
    'Romance',
    'Sci-Fi',
    'Thriller',
  ];

  return (
    <div className="space-y-5">
      {/* 5 Segment Persona Navigation Tabs with Counts */}
      <div className="bg-white border border-stone-200 rounded-xl p-1.5 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {segmentTabs.map((tab) => {
            const isActive = selectedSegment === tab.id;
            return (
              <button
                key={tab.id === null ? 'all' : tab.id}
                onClick={() => {
                  setSelectedSegment(tab.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-stone-700'
                  }`}
                >
                  {tab.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by User ID (e.g. USR-00001)..."
            className="w-64"
          />
          <FilterPanel
            selectedSegment={selectedSegment}
            onSelectSegment={(id) => {
              setSelectedSegment(id);
              setPage(1);
            }}
            selectedGenre={selectedGenre}
            onSelectGenre={(g) => {
              setSelectedGenre(g);
              setPage(1);
            }}
            sortBy={sortBy}
            onSelectSortBy={(s) => {
              setSortBy(s);
              setPage(1);
            }}
            sortDesc={sortDesc}
            onToggleSortDesc={() => setSortDesc(!sortDesc)}
            onClearFilters={() => {
              setSelectedSegment(null);
              setSelectedGenre(null);
              setSearchQuery('');
              setPage(1);
            }}
            genres={genres}
          />
        </div>

        <div className="flex items-center gap-2">
          <ExportMenu
            batchId={activeBatch.batch_id}
            hasErrors={activeBatch.invalid_rows > 0}
          />
        </div>
      </div>

      {/* Main Data Table */}
      {error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : (
        <DataTable
          users={users}
          totalUsers={totalMatched}
          currentPage={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          onSelectUser={(u) => setInspectUser(u)}
          isLoading={isLoading}
        />
      )}

      {/* Individual User Telemetry Drawer */}
      <UserDetailDrawer user={inspectUser} onClose={() => setInspectUser(null)} />
    </div>
  );
};
