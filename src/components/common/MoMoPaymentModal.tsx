import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, CheckCircle2, AlertCircle, Clock, Smartphone, ShieldCheck } from 'lucide-react';

export const MoMoPaymentModal: React.FC = () => {
  const {
    isMoMoModalOpen,
    momoPaymentContext,
    closeMoMoModal,
    demoPaymentOutcome,
    addSparks,
    activateAtollPlusSubscription,
    addSystemLog,
    addToast,
  } = useAppStore();

  const [provider, setProvider] = useState<'mtn' | 'airtel'>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('0788412890');
  const [paymentStep, setPaymentStep] = useState<'form' | 'ussd_pending' | 'result'>('form');
  const [resultOutcome, setResultOutcome] = useState<'success' | 'declined' | 'timeout' | null>(null);

  if (!isMoMoModalOpen || !momoPaymentContext) return null;

  const handleInitiatePayment = () => {
    setPaymentStep('ussd_pending');

    addSystemLog(
      'momo_payment: push_sent',
      `USSD push initiated for ${momoPaymentContext.amountRwf.toLocaleString()} RWF to ${phoneNumber} (${provider.toUpperCase()}).`,
      'financial'
    );

    // Simulate USSD response delay (2.5 seconds)
    setTimeout(() => {
      const outcome = demoPaymentOutcome.toLowerCase() as 'success' | 'declined' | 'timed out';

      if (outcome === 'success') {
        setResultOutcome('success');
        if (momoPaymentContext.type === 'plus') {
          activateAtollPlusSubscription(momoPaymentContext.planDuration || 'month');
        } else if (momoPaymentContext.type === 'sparks' && momoPaymentContext.sparksAmount) {
          addSparks(momoPaymentContext.sparksAmount);
        }
      } else if (outcome === 'declined') {
        setResultOutcome('declined');
        addSystemLog(
          'momo_payment: declined',
          `Transaction of ${momoPaymentContext.amountRwf} RWF was declined by subscriber or insufficient funds.`,
          'warning'
        );
        addToast('Payment Declined', 'Transaction declined by mobile money network.', 'error');
      } else {
        setResultOutcome('timeout');
        addSystemLog(
          'momo_payment: timed_out',
          `USSD prompt timed out without PIN input on handset.`,
          'warning'
        );
        addToast('Payment Timed Out', 'No PIN response detected on device.', 'warning');
      }

      setPaymentStep('result');
    }, 2400);
  };

  const handleClose = () => {
    setPaymentStep('form');
    setResultOutcome(null);
    closeMoMoModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#081C1E] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-teal-800/40 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-teal-900/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">MoMo Pay Gateway</h3>
              <p className="text-[11px] text-slate-500">Rwanda Instant Mobile Payment</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {paymentStep === 'form' && (
            <>
              {/* Order summary box */}
              <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Item</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{momoPaymentContext.title}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total</span>
                  <p className="text-base font-extrabold text-[#0D5C63] dark:text-[#78CDA7]">
                    {momoPaymentContext.amountRwf.toLocaleString()} RWF
                  </p>
                </div>
              </div>

              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Choose Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider('mtn')}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                      provider === 'mtn'
                        ? 'bg-amber-400/15 border-amber-500 text-amber-900 dark:text-amber-300 shadow-xs ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>MTN MoMo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider('airtel')}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                      provider === 'airtel'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-900 dark:text-rose-300 shadow-xs ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    <span>Airtel Money</span>
                  </button>
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mobile Money Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    +250
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="788 000 000"
                    className="w-full pl-14 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0D5C63]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Prompt will be sent via direct USSD flash message.</span>
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleInitiatePayment}
                className="w-full py-3 px-4 rounded-xl bg-[#0D5C63] hover:bg-[#0a484e] text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Pay {momoPaymentContext.amountRwf.toLocaleString()} RWF with {provider === 'mtn' ? 'MTN' : 'Airtel'}</span>
              </button>

              <div className="text-[10px] text-center text-slate-400 pt-1">
                Demo simulation mode active. Current outcome setting: <strong className="text-slate-700 dark:text-slate-200">{demoPaymentOutcome}</strong> (changeable in Demo Controls ⚡).
              </div>
            </>
          )}

          {paymentStep === 'ussd_pending' && (
            <div className="py-8 text-center space-y-4">
              <div className="relative mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-amber-600 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">USSD Push Dispatched</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Please approve the prompt on your phone or dial <strong>*182#</strong> to enter your PIN.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 font-mono text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
                <Clock className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Awaiting network verification...</span>
              </div>
            </div>
          )}

          {paymentStep === 'result' && (
            <div className="py-6 text-center space-y-4">
              {resultOutcome === 'success' ? (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Payment Confirmed!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {momoPaymentContext.type === 'plus'
                        ? 'Atoll Plus privileges are now activated on your account.'
                        : `Your wallet received +${momoPaymentContext.sparksAmount} Sparks.`}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                  >
                    Done
                  </button>
                </>
              ) : resultOutcome === 'declined' ? (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                    <AlertCircle className="w-9 h-9" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Payment Declined</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      The network transaction was cancelled or balance was insufficient.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentStep('form')}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-teal-700 text-white font-bold text-xs transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleClose}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                    <Clock className="w-9 h-9" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Request Timed Out</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      No response was received within 60 seconds from the handset.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentStep('form')}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-teal-700 text-white font-bold text-xs transition-colors"
                    >
                      Retry Push
                    </button>
                    <button
                      onClick={handleClose}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
