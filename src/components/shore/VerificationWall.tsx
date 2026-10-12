import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DICTIONARY } from '../../data/mock';
import {
  Shield,
  ShieldCheck,
  Upload,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Lock,
  FileText,
} from 'lucide-react';

export const VerificationWall: React.FC = () => {
  const {
    verificationStatus,
    setVerificationStatus,
    demoIdOutcome,
    language,
    addSystemLog,
    addToast,
  } = useAppStore();

  const [docType, setDocType] = useState<'id' | 'passport'>('id');
  const [hasSelectedFile, setHasSelectedFile] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const dict = DICTIONARY[language];

  const handleStartProcessing = () => {
    if (!consentAccepted) {
      addToast('Consent Required', 'Please accept Rwanda Data Protection Law consent.', 'warning');
      return;
    }

    setVerificationStatus('processing');
    addSystemLog(
      'id_verification: initiated',
      `Document submitted (${docType.toUpperCase()}). Analyzing security watermarks.`,
      'security'
    );

    // 3-second animated processing skeleton
    setTimeout(() => {
      const outcome = demoIdOutcome;
      if (outcome === 'Approved') {
        setVerificationStatus('approved');
        addSystemLog(
          'id_verification: approved',
          'National ID passed algorithmic validation. Verified Blue Shield issued. Raw scan purged.',
          'security'
        );
        addToast('Verification Approved! 🛡️', 'Welcome to The Shore. Your verified profile is ready.', 'success');
      } else if (outcome === 'Needs Retry') {
        setVerificationStatus('needs_retry');
        addSystemLog(
          'id_verification: needs_retry',
          'Document glare detected on National ID card. Retry requested.',
          'warning'
        );
        addToast('Verification Needs Retry', 'Document was slightly blurry or reflective.', 'warning');
      } else {
        setVerificationStatus('rejected');
        addSystemLog(
          'id_verification: rejected',
          'Verification failed: Name or birth date mismatch with registrar records.',
          'security'
        );
        addToast('Verification Rejected', 'Document criteria did not match official records.', 'error');
      }
    }, 3000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 pb-20 justify-center max-w-[430px] mx-auto space-y-4">
      {/* Isolation Banner */}
      <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2.5 shadow-xs">
        <Lock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          {dict.isolationNotice}
        </p>
      </div>

      {verificationStatus === 'not_started' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-teal-900/40 shadow-sm space-y-4">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {dict.shoreLockedTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {dict.shoreLockedSubtitle}
            </p>
          </div>

          {/* Compliance & Privacy Box */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>Rwanda Data Protection Law (2021) Compliance</span>
            </div>
            <ul className="space-y-1 list-disc list-inside text-slate-500 dark:text-slate-400">
              <li>Stores <strong>only verified status, verified age, and district</strong>.</li>
              <li>Document images are purged immediately post-validation.</li>
              <li>Never linked to your anonymous Lagoon mask.</li>
            </ul>
          </div>

          {/* Document Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Identification Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDocType('id')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  docType === 'id'
                    ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-900 dark:text-sky-200 ring-1 ring-sky-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                National ID (Indangamuntu)
              </button>
              <button
                type="button"
                onClick={() => setDocType('passport')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  docType === 'passport'
                    ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-900 dark:text-sky-200 ring-1 ring-sky-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Rwandan Passport
              </button>
            </div>
          </div>

          {/* Upload Simulation Area */}
          <div
            onClick={() => setHasSelectedFile(true)}
            className={`p-5 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
              hasSelectedFile
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-sky-500 bg-slate-50/50 dark:bg-slate-900/40'
            }`}
          >
            {hasSelectedFile ? (
              <div className="space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {docType === 'id' ? 'ID_Front_Scan.jpg attached' : 'Passport_Bio_Page.jpg attached'}
                </p>
                <span className="text-[10px] text-emerald-600">Tap to replace document</span>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Tap to scan or upload {docType === 'id' ? 'National ID' : 'Passport'}
                </p>
                <span className="text-[10px] text-slate-400">JPG, PNG or PDF (Auto-crop & contrast)</span>
              </div>
            )}
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5 rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="leading-snug text-[11px]">
              I consent to identity validation in accordance with Rwanda Law No 058/2021 relating to the protection of personal data.
            </span>
          </label>

          {/* Submit Button */}
          <button
            onClick={handleStartProcessing}
            disabled={!hasSelectedFile || !consentAccepted}
            className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>Submit for Verification</span>
          </button>
        </div>
      )}

      {verificationStatus === 'processing' && (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-teal-900/40 shadow-sm text-center space-y-5">
          <div className="relative mx-auto w-16 h-16">
            <div className="w-16 h-16 rounded-full border-4 border-sky-200 dark:border-sky-900 border-t-sky-600 animate-spin" />
            <ShieldCheck className="w-7 h-7 text-sky-600 absolute inset-0 m-auto" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Verifying Rwandan Identity...</h4>
            <p className="text-xs text-slate-500">Cross-referencing cryptographic document hallmarks</p>
          </div>

          {/* Skeleton placeholders */}
          <div className="space-y-2 max-w-xs mx-auto">
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse w-3/4 mx-auto" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse w-1/2 mx-auto" />
          </div>

          <p className="text-[10px] text-slate-400">
            Current Demo Simulation outcome configured: <strong>{demoIdOutcome}</strong> (Adjust in Demo Controls ⚡)
          </p>
        </div>
      )}

      {verificationStatus === 'needs_retry' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B2124] border border-amber-300 dark:border-amber-800/40 shadow-sm text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <RotateCcw className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Verification Needs Retry</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              We detected lighting glare and cut-off edges on the uploaded document scan.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs text-left space-y-1">
            <p className="font-bold">Tips for quick approval:</p>
            <ul className="list-disc list-inside text-[11px] opacity-90">
              <li>Place ID flat on a non-reflective dark surface.</li>
              <li>Avoid direct flash glare over the national photo.</li>
            </ul>
          </div>

          <button
            onClick={() => setVerificationStatus('not_started')}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Upload</span>
          </button>
        </div>
      )}

      {verificationStatus === 'rejected' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B2124] border border-rose-300 dark:border-rose-800/40 shadow-sm text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Verification Declined</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              The submitted document could not be matched with active civil registry records.
            </p>
          </div>

          <button
            onClick={() => setVerificationStatus('not_started')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Back to Document Selection
          </button>
        </div>
      )}
    </div>
  );
};
