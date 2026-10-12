import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { IncidentReport } from '../../types';
import {
  ShieldAlert,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  EyeOff,
  UserX,
  FileText,
  Activity,
} from 'lucide-react';

export const ModeratorView: React.FC = () => {
  const {
    incidentReports,
    updateIncidentStatus,
    hidePost,
    setCurrentTab,
    isAtollPlusActive,
  } = useAppStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const filteredIncidents = incidentReports.filter((inc) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return inc.status === 'pending';
    return inc.status !== 'pending';
  });

  const handleDismiss = (inc: IncidentReport) => {
    updateIncidentStatus(inc.id, 'resolved');
  };

  const handleWarn = (inc: IncidentReport) => {
    updateIncidentStatus(inc.id, 'warned');
  };

  const handleHide = (inc: IncidentReport) => {
    updateIncidentStatus(inc.id, 'hidden');
    if (inc.targetType === 'post') {
      hidePost(inc.targetId);
    }
  };

  const handleSuspend = (inc: IncidentReport) => {
    updateIncidentStatus(inc.id, 'suspended');
  };

  return (
    <div className="flex-1 flex flex-col p-3.5 pb-20 space-y-4 max-w-[430px] mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-teal-900/30">
        <button
          onClick={() => setCurrentTab('me')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Console</span>
        </button>

        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Activity className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
          <span>Atoll Backstage Moderation</span>
        </span>
      </div>

      {/* Revenue & KPI Tracker (Tabular figures per constitution) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Revenue & Platform Health
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {/* Active Plus Subscribers */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-teal-900/40 shadow-2xs space-y-1">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Users className="w-3 h-3 text-teal-600" />
              <span>Plus Subscribers</span>
            </span>
            <p className="text-base font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {isAtollPlusActive ? 149 : 148}
            </p>
            <span className="text-[9px] text-emerald-600 font-semibold">+12% this week</span>
          </div>

          {/* Sparks Sold */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-teal-900/40 shadow-2xs space-y-1">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#EE6C4D]" />
              <span>Sparks Sold</span>
            </span>
            <p className="text-base font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              284,500
            </p>
            <span className="text-[9px] text-teal-600 font-semibold">MTN MoMo airtime rails</span>
          </div>

          {/* Simulated Gross Revenue */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-teal-900/40 shadow-2xs space-y-1">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>Gross Revenue (RWF)</span>
            </span>
            <p className="text-base font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
              1,280,000
            </p>
            <span className="text-[9px] text-slate-400 font-mono">Net after telco fee</span>
          </div>

          {/* ID Validation Velocity */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-teal-900/40 shadow-2xs space-y-1">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-sky-600" />
              <span>ID Verification Pass</span>
            </span>
            <p className="text-base font-extrabold font-mono tabular-nums text-sky-700 dark:text-sky-400">
              94.2%
            </p>
            <span className="text-[9px] text-slate-400 font-mono">Avg velocity: 2.8s</span>
          </div>
        </div>
      </div>

      {/* Incident Queue */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Live Incident Queue ({filteredIncidents.length})
          </h3>

          <div className="flex items-center gap-1 text-[11px]">
            {(['all', 'pending', 'resolved'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`py-0.5 px-2 rounded-md capitalize font-medium ${
                  activeFilter === filter
                    ? 'bg-slate-900 text-white dark:bg-teal-700'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredIncidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-800">
              No incidents found matching this status filter.
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isResolved = inc.status !== 'pending';

              return (
                <div
                  key={inc.id}
                  className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${
                    isResolved
                      ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
                      : 'bg-white dark:bg-[#0B2124] border-rose-300 dark:border-rose-900/50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-white capitalize">
                        {inc.targetType} Flag
                      </span>
                      <span className="text-[10px] text-slate-400">· by {inc.reporterMaskName}</span>
                    </div>

                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        inc.status === 'pending'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          : inc.status === 'hidden'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : inc.status === 'warned'
                          ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-800 dark:text-slate-200">Violation Reason:</strong> {inc.reason}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 break-words">
                    &ldquo;{inc.contentSnippet}&rdquo;
                  </div>

                  {/* Incident Action Buttons */}
                  {!isResolved && (
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        onClick={() => handleDismiss(inc)}
                        className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold"
                        title="Dismiss report as benign"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleWarn(inc)}
                        className="py-1 px-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] font-bold flex items-center justify-center gap-0.5"
                        title="Send formal warning to mask"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>Warn</span>
                      </button>
                      <button
                        onClick={() => handleHide(inc)}
                        className="py-1 px-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold flex items-center justify-center gap-0.5"
                        title="Instantly remove post from Lagoon feed"
                      >
                        <EyeOff className="w-2.5 h-2.5" />
                        <span>Hide Post</span>
                      </button>
                      <button
                        onClick={() => handleSuspend(inc)}
                        className="py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center justify-center gap-0.5"
                        title="Suspend account access"
                      >
                        <UserX className="w-2.5 h-2.5" />
                        <span>Suspend</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
