import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import { BatchSummary, AnalyticsOverview } from './types';
import { AppSidebar, NavItemKey } from './components/layout/AppSidebar';
import { AppHeader } from './components/layout/AppHeader';

import { OverviewPage } from './pages/OverviewPage';
import { AudienceSegmentsPage } from './pages/AudienceSegmentsPage';
import { UserExplorerPage } from './pages/UserExplorerPage';
import { CSVImportPage } from './pages/CSVImportPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ModelEvaluationPage } from './pages/ModelEvaluationPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [currentNav, setCurrentNav] = useState<NavItemKey>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [explorerSegmentFilter, setExplorerSegmentFilter] = useState<number | null>(null);

  // Initialize data and check backend connectivity
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const health = await api.getHealth();
      setApiConnected(health.status === 'ok');

      // Fetch batch list
      const batchListRes = await api.listBatches();
      let currentBatches = batchListRes.batches;

      // If no batches exist yet, initialize the baseline reference dataset
      if (currentBatches.length === 0) {
        try {
          const initRes = await api.initReferenceBatch();
          currentBatches = [initRes.summary];
        } catch (_) {
          // ignore if reference dataset not found
        }
      }

      setBatches(currentBatches);
      const activeId = currentBatches.length > 0 ? currentBatches[0].batch_id : null;
      setSelectedBatchId(activeId);

      // Fetch analytics for active batch
      if (activeId) {
        const analyticsData = await api.getAnalyticsOverview(activeId);
        setAnalytics(analyticsData);
      } else {
        const analyticsData = await api.getAnalyticsOverview();
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Failed to load Streamly platform state:', err);
      setApiConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const health = await api.getHealth();
      setApiConnected(health.status === 'ok');

      const batchListRes = await api.listBatches();
      setBatches(batchListRes.batches);

      const targetId = selectedBatchId || (batchListRes.batches[0]?.batch_id ?? null);
      if (targetId) {
        const analyticsData = await api.getAnalyticsOverview(targetId);
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectBatch = async (batchId: string) => {
    setSelectedBatchId(batchId);
    setIsLoading(true);
    try {
      const analyticsData = await api.getAnalyticsOverview(batchId);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error switching batch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchCompleted = async (newBatch: BatchSummary) => {
    setBatches((prev) => [newBatch, ...prev.filter((b) => b.batch_id !== newBatch.batch_id)]);
    setSelectedBatchId(newBatch.batch_id);
    try {
      const analyticsData = await api.getAnalyticsOverview(newBatch.batch_id);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigateToUsersWithSegment = (segmentId?: number) => {
    setExplorerSegmentFilter(segmentId !== undefined ? segmentId : null);
    setCurrentNav('users');
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const activeBatch = batches.find((b) => b.batch_id === selectedBatchId) || null;

  // Title and subtitle mapping for current navigation
  const pageMeta: Record<NavItemKey, { title: string; subtitle: string; breadcrumbs: string[] }> = {
    overview: {
      title: 'Audience Overview',
      subtitle: 'Behavioral clustering & engagement intelligence',
      breadcrumbs: ['Intelligence', 'Dashboard'],
    },
    segments: {
      title: 'Audience Segments',
      subtitle: 'Discovered unsupervised viewer personas',
      breadcrumbs: ['Audience', 'Personas'],
    },
    users: {
      title: 'User Explorer',
      subtitle: 'Filter and inspect segmented viewer records',
      breadcrumbs: ['Audience', 'Viewers'],
    },
    import: {
      title: 'Import & Segment Audience',
      subtitle: 'Batch telemetry upload and K-Means classification',
      breadcrumbs: ['Ingestion', 'CSV Import'],
    },
    recommendations: {
      title: 'Recommendation Engine',
      subtitle: 'Transparent catalog title personalization',
      breadcrumbs: ['Personalization', 'Catalog'],
    },
    evaluation: {
      title: 'Model Evaluation',
      subtitle: 'K-Means clustering metrics & test suite benchmarks',
      breadcrumbs: ['Machine Learning', 'Evaluation'],
    },
    health: {
      title: 'System Health',
      subtitle: 'Containerized API & model artifact diagnostics',
      breadcrumbs: ['Infrastructure', 'Health'],
    },
    settings: {
      title: 'Platform Settings',
      subtitle: 'Configuration, storage paths & security constraints',
      breadcrumbs: ['System', 'Settings'],
    },
  };

  const currentMeta = pageMeta[currentNav];

  return (
    <div className="min-h-screen bg-[#fafaf9] flex">
      {/* Sidebar Navigation */}
      <AppSidebar
        currentNav={currentNav}
        onNavigate={setCurrentNav}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        apiConnected={apiConnected}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        <AppHeader
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          breadcrumbs={currentMeta.breadcrumbs}
          batches={batches}
          selectedBatchId={selectedBatchId}
          onSelectBatch={handleSelectBatch}
          onRefresh={handleRefresh}
          onOpenImport={() => setCurrentNav('import')}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {currentNav === 'overview' && (
            <OverviewPage
              analytics={analytics}
              isLoading={isLoading}
              onNavigateToUsers={handleNavigateToUsersWithSegment}
              onNavigateToImport={() => setCurrentNav('import')}
            />
          )}

          {currentNav === 'segments' && (
            <AudienceSegmentsPage
              analytics={analytics}
              isLoading={isLoading}
              onNavigateToUsers={handleNavigateToUsersWithSegment}
              onNavigateToImport={() => setCurrentNav('import')}
            />
          )}

          {currentNav === 'users' && (
            <UserExplorerPage
              activeBatch={activeBatch}
              initialSegmentFilter={explorerSegmentFilter}
              onNavigateToImport={() => setCurrentNav('import')}
            />
          )}

          {currentNav === 'import' && (
            <CSVImportPage
              onBatchCompleted={handleBatchCompleted}
              onNavigateToUsers={handleNavigateToUsersWithSegment}
            />
          )}

          {currentNav === 'recommendations' && <RecommendationsPage />}

          {currentNav === 'evaluation' && <ModelEvaluationPage />}

          {currentNav === 'health' && <SystemHealthPage />}

          {currentNav === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default App;
