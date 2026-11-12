import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Sparkles,
  Wallet,
} from 'lucide-react';

interface DeliveryAnimationProps {
  isVisible: boolean;
  restaurantName: string;
  orderId: string;
  estimatedMinutes: number;
  grandTotal: number;
  paymentMethod: 'online' | 'cod';
  onDismiss: () => void;
}

export const DeliveryAnimation: React.FC<DeliveryAnimationProps> = ({
  isVisible,
  restaurantName,
  orderId,
  estimatedMinutes,
  grandTotal,
  paymentMethod,
  onDismiss,
}) => {
  const [phase, setPhase] = useState<'riding' | 'arrived'>('riding');

  useEffect(() => {
    if (!isVisible) {
      setPhase('riding');
      return;
    }
    setPhase('riding');
    const t1 = setTimeout(() => setPhase('arrived'), 1800);
    const t2 = setTimeout(() => onDismiss(), 7000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 overflow-hidden backdrop-blur-md bg-stone-950/60 transition-all duration-500 animate-fadeIn"
    >
      {/* Background animated elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Road strip across middle */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-28 bg-stone-900/40 border-y-2 border-stone-700/30 flex items-center overflow-hidden">
          {/* Animated road center dashes */}
          <div className="w-[200%] flex gap-8 animate-[roadDash_0.7s_linear_infinite]">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="h-2 w-14 rounded-full bg-amber-400/70 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
              />
            ))}
          </div>
        </div>

        {/* Speed bike zooming across the screen from left to right */}
        {phase === 'riding' && (
          <div className="absolute top-1/2 -translate-y-1/2 w-full pointer-events-none">
            <div className="animate-[bikeAcross_1.8s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards] flex items-center">
              <div className="relative flex items-center">
                {/* Wind trails */}
                <div className="flex flex-col gap-1.5 -mr-2 opacity-70">
                  <span className="w-12 h-0.5 bg-orange-400 rounded-full animate-pulse" />
                  <span className="w-16 h-0.5 bg-amber-300 rounded-full" />
                  <span className="w-8 h-0.5 bg-white rounded-full" />
                </div>
                {/* Scooter emoji */}
                <span className="text-6xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)] transform scale-x-[-1] inline-block">
                  🛵
                </span>
                {/* Food parcel */}
                <span className="text-2xl -ml-2 -mt-4 drop-shadow-md">📦</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Confirmation Card */}
      <div
        className={`relative z-10 bg-white rounded-3xl shadow-2xl border border-[#E7DFD3] p-6 sm:p-8 max-w-md w-full text-center space-y-5 transition-all duration-500 ${
          phase === 'arrived'
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-90 opacity-0 translate-y-6'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Checkmark Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#D94E28] to-amber-500 flex items-center justify-center shadow-lg shadow-[#D94E28]/30">
            <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <span className="absolute -top-1 -right-1 p-1.5 rounded-full bg-amber-400 text-white shadow-md animate-bounce">
            <Sparkles className="w-4 h-4" />
          </span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Order Confirmed! 🎉
          </h2>
          <p className="text-stone-600 text-sm">
            Freshly preparing at <span className="font-bold text-stone-900">{restaurantName}</span>
          </p>
        </div>

        {/* Status badges */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E7DFD3] text-xs font-bold text-stone-700">
            <Clock className="w-3.5 h-3.5 text-[#D94E28]" />
            <span>ETA {estimatedMinutes} Mins</span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              paymentMethod === 'cod'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            {paymentMethod === 'cod' ? (
              <>
                <Wallet className="w-3.5 h-3.5 text-amber-700" />
                <span>Cash on Delivery</span>
              </>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                <span>Paid Online</span>
              </>
            )}
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 text-stone-600 font-mono-code text-[11px]">
            <MapPin className="w-3 h-3 text-stone-400" />
            <span>Live GPS Active</span>
          </div>
        </div>

        {/* Bill & Order Details */}
        <div className="rounded-2xl bg-[#FAF7F2] border border-[#E7DFD3] p-4 space-y-2 text-sm text-left">
          <div className="flex justify-between text-stone-600 text-xs">
            <span>Order Reference</span>
            <span className="font-mono-code font-bold text-stone-900">{orderId}</span>
          </div>
          <div className="border-t border-[#E7DFD3] pt-2 flex justify-between items-center text-sm font-bold text-stone-900">
            <span>{paymentMethod === 'cod' ? 'Total (Pay to Rider)' : 'Total Paid'}</span>
            <span className="font-mono-code text-base text-[#D94E28]">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* COD specific callout */}
        {paymentMethod === 'cod' && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-left text-xs text-amber-900">
            <Wallet className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <div>
              <span className="font-bold">Cash on Delivery selected:</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Please hand over <strong>₹{grandTotal.toFixed(2)}</strong> or scan the delivery
                partner&apos;s UPI QR code upon arrival.
              </p>
            </div>
          </div>
        )}

        {/* Action Button to dismiss and view order */}
        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-[#D94E28] text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Track Order Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <style>{`
        @keyframes roadDash {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes bikeAcross {
          0% { transform: translateX(-160px); }
          50% { transform: translateX(calc(50vw - 40px)); }
          100% { transform: translateX(calc(100vw + 160px)); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
