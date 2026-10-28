import React from 'react';
import {
  LayoutDashboard,
  Users2,
  UserSearch,
  UploadCloud,
  Sparkles,
  LineChart,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Tv,
} from 'lucide-react';

export type NavItemKey =
  | 'overview'
  | 'segments'
  | 'users'
  | 'import'
  | 'recommendations'
  | 'evaluation'
  | 'health'
  | 'settings';

interface AppSidebarProps {
  currentNav: NavItemKey;
  onNavigate: (nav: NavItemKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  apiConnected: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentNav,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  apiConnected,
}) => {
  const navItems = [
    { key: 'overview' as NavItemKey, label: 'Overview', icon: LayoutDashboard },
    { key: 'segments' as NavItemKey, label: 'Audience Segments', icon: Users2 },
    { key: 'users' as NavItemKey, label: 'User Explorer', icon: UserSearch },
    { key: 'import' as NavItemKey, label: 'CSV Import', icon: UploadCloud },
    { key: 'recommendations' as NavItemKey, label: 'Recommendations', icon: Sparkles },
    { key: 'evaluation' as NavItemKey, label: 'Model Evaluation', icon: LineChart },
    { key: 'health' as NavItemKey, label: 'System Health', icon: Activity },
    { key: 'settings' as NavItemKey, label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 flex flex-col bg-stone-900 border-r border-stone-800 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Logo Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-stone-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-700 to-plum-800 flex items-center justify-center shadow-md flex-shrink-0">
            <Tv className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-base tracking-tight leading-none">
                STREAMLY
              </span>
              <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider mt-1">
                Audience Intelligence
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentNav === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-brand-900/60 text-white shadow-sm border border-brand-700/50'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/70'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-brand-300' : 'text-stone-400 group-hover:text-stone-200'
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Area: API Status & Workspace */}
      <div className="p-3 border-t border-stone-800/80 bg-stone-950/40">
        {!isCollapsed ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-stone-800/50">
              <span className="text-stone-400 font-medium">Inference API</span>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    apiConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'
                  }`}
                />
                <span className={`text-[11px] font-semibold ${apiConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {apiConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="w-7 h-7 rounded-full bg-stone-700 flex items-center justify-center text-xs font-bold text-stone-200">
                DS
              </div>
              <div className="flex flex-col leading-tight overflow-hidden">
                <span className="text-xs font-medium text-stone-200 truncate">OTT Analytics Team</span>
                <span className="text-[10px] text-stone-500 truncate">Production Workspace</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`API: ${apiConnected ? 'Connected' : 'Offline'}`}>
            <div
              className={`w-3 h-3 rounded-full ${
                apiConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'
              }`}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
