import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DemoIdOutcome, DemoPaymentOutcome } from '../../types';
import {
  X,
  FastForward,
  ShieldCheck,
  CreditCard,
  Terminal,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';

export const DemoControlPanel: React.FC = () => {
  const {
    isDemoPanelOpen,
    setIsDemoPanelOpen,
    demoIdOutcome,
    setDemoIdOutcome,
    demoPaymentOutcome,
    setDemoPaymentOutcome,
    fastForwardTime,
    resetDemoState,
    systemLogs,
    setCurrentTab,
    openMoMoModal,
    addSparks,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'controls' | 'logs'>('controls');
  const [logFilter, setLogFilter] = useState<'all' | 'security' | 'financial' | 'info'>('all');

  if (!isDemoPanelOpen) return null;

  const idOptions: DemoIdOutcome[] = ['Approved', 'Needs Retry', 'Rejected'];
  const paymentOptions: DemoPaymentOutcome[] = ['Success', 'Declined', 'Timed out'];

  const filteredLogs = systemLogs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.level === logFilter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[430px] bg-white dark:bg-[#081C1E] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-teal-800/40 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-teal-900/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EE6C4D]/10 text-[#EE6C4D] flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Demo Control Suite</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Prototype simulator overrides & system logs</p>
            </div>
          </div>
          <button
            onClick={() => setIsDemoPanelOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Controls vs System Logs */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-slate-100 dark:border-teal-900/20 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'controls'
                ? 'bg-white dark:bg-[#0D5C63] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Simulator Overrides
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'logs'
                ? 'bg-white dark:bg-[#0D5C63] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>System Logs ({systemLogs.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {activeTab === 'controls' ? (
            <>
              {/* 1. Fast-Forward Time */}
              <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 space-y-2">
                <div className="flex items-center gap-2 text-[#0D5C63] dark:text-[#78CDA7] font-bold">
                  <FastForward className="w-4 h-4" />
                  <span>1. Fast-Forward Time & Escrow</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ages Shore chats by 2 days and injects 10 mock messages. Instantly satisfies progressive escrow criteria so &ldquo;Share My Number&rdquo; unlocks!
                </p>
                <button
                  onClick={fastForwardTime}
                  className="w-full py-2 px-3 rounded-xl bg-[#0D5C63] hover:bg-[#0a484e] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Fast-Forward Shore Chats (+2 Days, +10 Msgs)</span>
                </button>
              </div>

              {/* 2. ID Check Outcome Selector */}
              <div className="p-3.5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>2. ID Verification Outcome</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">
                    Current: {demoIdOutcome}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Select what the Rwanda Data Protection Law (2021) verification check will return when simulated:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {idOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setDemoIdOutcome(opt)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
                        demoIdOutcome === opt
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-sky-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Payment Outcome Selector */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                    <CreditCard className="w-4 h-4" />
                    <span>3. MoMo Payment Outcome</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                    Current: {demoPaymentOutcome}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Choose the response simulated when triggering MTN MoMo / Airtel Money checkout flows:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {paymentOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setDemoPaymentOutcome(opt)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
                        demoPaymentOutcome === opt
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-amber-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsDemoPanelOpen(false);
                      openMoMoModal({
                        title: 'Test MTN MoMo Checkout',
                        amountRwf: 3000,
                        type: 'plus',
                        planDuration: 'month',
                      });
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold text-center transition-colors"
                  >
                    Launch MoMo Payment Sheet
                  </button>
                  <button
                    onClick={() => addSparks(500)}
                    className="py-1.5 px-2.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-[11px] font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-[#EE6C4D]" />
                    <span>+500 Sparks</span>
                  </button>
                </div>
              </div>

              {/* Quick Navigation to Backstage Moderator */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Backstage Moderator View</h4>
                  <p className="text-[10px] text-slate-500">Live incident triage & revenue statistics</p>
                </div>
                <button
                  onClick={() => {
                    setIsDemoPanelOpen(false);
                    setCurrentTab('moderator');
                  }}
                  className="py-1.5 px-3 rounded-xl bg-slate-900 dark:bg-teal-700 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Open Console</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Reset Demo Button */}
              <div className="pt-2">
                <button
                  onClick={resetDemoState}
                  className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo State (Clears LocalStorage)</span>
                </button>
              </div>
            </>
          ) : (
            /* System Log Viewer */
            <div className="space-y-3">
              {/* Filter pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {(['all', 'security', 'financial', 'info'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLogFilter(filter)}
                    className={`py-1 px-2.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                      logFilter === filter
                        ? 'bg-slate-900 text-white dark:bg-teal-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Logs Stream */}
              <div className="space-y-2">
                {filteredLogs.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">No logs recorded for this filter.</div>
                ) : (
                  filteredLogs.map((log) => {
                    let badgeClass = 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800';
                    let Icon = Info;
                    if (log.level === 'security') {
                      badgeClass = 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30';
                      Icon = ShieldAlert;
                    } else if (log.level === 'warning') {
                      badgeClass = 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/30';
                      Icon = ShieldAlert;
                    } else if (log.level === 'financial') {
                      badgeClass = 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/30';
                      Icon = CreditCard;
                    }

                    return (
                      <div
                        key={log.id}
                        className={`p-2.5 rounded-xl border text-[11px] font-mono space-y-1 ${badgeClass}`}
                      >
                        <div className="flex items-center justify-between text-[10px] opacity-75">
                          <span className="flex items-center gap-1 font-bold">
                            <Icon className="w-3 h-3" />
                            <span>{log.eventType}</span>
                          </span>
                          <span>{log.timestamp}</span>
                        </div>
                        <p className="font-sans text-slate-700 dark:text-slate-300 leading-normal">
                          {log.details}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
