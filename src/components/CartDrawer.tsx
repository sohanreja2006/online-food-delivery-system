import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bike,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { DELIVERY_STRATEGIES, DeliveryModeId } from '../models/DeliveryStrategy';
import { AuthenticationException } from '../models/Exceptions';
import { FoodDeliverySystem } from '../models/FoodDeliverySystem';
import { OrderSummary } from '../models/Order';
import { FoodArtwork, VegIndicator } from './FoodArtwork';
import { formatCurrency, ItemTypeBadge } from './uiBadges';

export type PaymentMethod = 'online' | 'cod';

interface CartDrawerProps {
  system: FoodDeliverySystem;
  isOpen: boolean;
  isSupabaseActive: boolean;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onClose: () => void;
  onUpdateQty: (entryKey: string, delta: number) => void;
  onClearCart: () => void;
  onOrderPlaced: (
    summary: OrderSummary,
    savedDetails: { name: string; phone: string; address: string; landmark: string },
    paymentMethod: PaymentMethod,
  ) => void;
  onRecordError: (error: unknown) => string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  system,
  isOpen,
  isSupabaseActive,
  isAuthenticated,
  onOpenAuth,
  onClose,
  onUpdateQty,
  onClearCart,
  onOrderPlaced,
  onRecordError,
}) => {
  const [deliveryMode, setDeliveryMode] = useState<DeliveryModeId>('standard');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | undefined>(undefined);
  const [recipientName, setRecipientName] = useState(system.customer.name);
  const [phone, setPhone] = useState(system.customer.phone);
  const [email, setEmail] = useState(system.customer.email);
  const [address, setAddress] = useState(system.customer.address);
  const [landmark, setLandmark] = useState(system.customer.landmark);
  const [pincode, setPincode] = useState('');
  const [pincodeCity, setPincodeCity] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pincodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRecipientName(system.customer.name);
      setPhone(system.customer.phone);
      setEmail(system.customer.email);
      setAddress(system.customer.address);
      setLandmark(system.customer.landmark);
      setPincode('');
      setPincodeCity('');
      setPincodeError(null);
      setErrorMsg(null);
    }
  }, [isOpen, system]);

  /** Known PIN code fallback table for instant offline resolution */
  const getOfflinePinLocation = (pin: string): string | null => {
    const prefix2 = pin.slice(0, 2);
    const prefix3 = pin.slice(0, 3);
    const knownExact: Record<string, string> = {
      '700017': 'Park Circus, Kolkata, West Bengal',
      '700001': 'BBD Bagh, Kolkata, West Bengal',
      '700019': 'Ballygunge, Kolkata, West Bengal',
      '700091': 'Salt Lake Sector V, Kolkata, West Bengal',
      '700156': 'New Town Action Area I, Kolkata, West Bengal',
      '110001': 'Connaught Place, New Delhi',
      '400001': 'Fort, Mumbai, Maharashtra',
      '560001': 'MG Road, Bengaluru, Karnataka',
      '600001': 'George Town, Chennai, Tamil Nadu',
      '500001': 'Afzal Gunj, Hyderabad, Telangana',
    };
    if (knownExact[pin]) return knownExact[pin];

    const map3: Record<string, string> = {
      '700': 'Kolkata, West Bengal',
      '711': 'Howrah, West Bengal',
      '712': 'Hooghly, West Bengal',
      '713': 'Bardhaman, West Bengal',
      '721': 'Midnapore, West Bengal',
      '734': 'Siliguri, West Bengal',
      '736': 'Cooch Behar, West Bengal',
      '741': 'Nadia, West Bengal',
      '742': 'Murshidabad, West Bengal',
      '110': 'New Delhi, Delhi',
      '122': 'Gurugram, Haryana',
      '201': 'Noida / Ghaziabad, Uttar Pradesh',
      '400': 'Mumbai, Maharashtra',
      '411': 'Pune, Maharashtra',
      '560': 'Bengaluru, Karnataka',
      '600': 'Chennai, Tamil Nadu',
      '500': 'Hyderabad, Telangana',
      '380': 'Ahmedabad, Gujarat',
      '302': 'Jaipur, Rajasthan',
      '682': 'Kochi, Kerala',
    };
    if (map3[prefix3]) return `${map3[prefix3]} - ${pin}`;

    const map2: Record<string, string> = {
      '70': 'Kolkata Region, West Bengal',
      '71': 'West Bengal',
      '72': 'West Bengal',
      '73': 'North Bengal, West Bengal',
      '74': 'West Bengal',
      '11': 'Delhi NCR',
      '40': 'Mumbai Region, Maharashtra',
      '56': 'Bengaluru Region, Karnataka',
    };
    if (map2[prefix2]) return `${map2[prefix2]} - ${pin}`;
    return null;
  };

  /** Auto-fetch city/state from India 6-digit pincode after user stops typing. */
  const handlePincodeChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    setPincode(digits);
    setPincodeError(null);
    setPincodeCity('');
    if (pincodeTimerRef.current) clearTimeout(pincodeTimerRef.current);
    if (digits.length === 6) {
      setPincodeLoading(true);
      pincodeTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${digits}`);
          const json = (await res.json()) as Array<{
            Status: string;
            PostOffice?: Array<{ District: string; State: string; Name: string }>;
          }>;
          if (json[0]?.Status === 'Success' && json[0].PostOffice?.length) {
            const po = json[0].PostOffice[0];
            const cityLine = `${po.District}, ${po.State} - ${digits}`;
            setPincodeCity(cityLine);
            setAddress((prev) => {
              const cleaned = prev.replace(/,?\s*\d{6}$/, '').trim();
              return cleaned ? `${cleaned}, ${cityLine}` : cityLine;
            });
            setPincodeError(null);
            return;
          }
        } catch {
          // Network or offline: fall back to offline dictionary
        }

        const offlineMatch = getOfflinePinLocation(digits);
        if (offlineMatch) {
          setPincodeCity(offlineMatch);
          setAddress((prev) => {
            const cleaned = prev.replace(/,?\s*\d{6}$/, '').trim();
            return cleaned ? `${cleaned}, ${offlineMatch}` : offlineMatch;
          });
          setPincodeError(null);
        } else {
          setPincodeError('Pincode verified. Add your locality.');
        }
        setPincodeLoading(false);
      }, 400);
    } else {
      setPincodeLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const cartEntries = system.getCartEntries();
  const cartRestaurant = system.getCartRestaurant();

  let billPreview: ReturnType<FoodDeliverySystem['calculateBillPreview']> | null = null;
  let deliveryError: string | null = null;
  if (cartEntries.length > 0) {
    try {
      billPreview = system.calculateBillPreview(deliveryMode, appliedPromo);
    } catch (err) {
      deliveryError = err instanceof Error ? err.message : 'Unable to compute bill.';
    }
  }

  const handleApplyPromo = (codeOverride?: string) => {
    const code = (codeOverride ?? promoInput).trim().toUpperCase();
    setErrorMsg(null);
    if (!code) {
      setAppliedPromo(undefined);
      return;
    }
    try {
      system.validatePromoCode(code);
      system.calculateBillPreview(deliveryMode, code);
      setAppliedPromo(code);
      setPromoInput(code);
    } catch (err) {
      const msg = onRecordError(err);
      setErrorMsg(msg);
      setAppliedPromo(undefined);
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      system.assertAuthenticatedForCheckout(isSupabaseActive);
      const summary = system.placeOrder({
        recipientName,
        phone,
        email,
        address,
        landmark,
        instructions,
        deliveryMode,
        promoCode: appliedPromo,
      });
      setAppliedPromo(undefined);
      setPromoInput('');
      setInstructions('');
      onOrderPlaced(
        summary,
        { name: recipientName, phone, address, landmark },
        paymentMethod,
      );
    } catch (err) {
      const msg = onRecordError(err);
      setErrorMsg(msg);
      if (err instanceof AuthenticationException) {
        onOpenAuth();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/45 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#FAF7F2] h-full shadow-2xl flex flex-col border-l border-[#E7DFD3]">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E7DFD3]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#D94E28]" />
            <div>
              <h2 className="text-lg font-bold text-stone-900">Your Order Cart</h2>
              {cartRestaurant && (
                <p className="text-xs text-stone-500">
                  From <span className="font-semibold text-stone-800">{cartRestaurant.name}</span> •{' '}
                  {cartRestaurant.distanceKm} km away
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cartEntries.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close cart"
              className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {cartEntries.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#E7DFD3] p-10 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">Your cart is empty</h3>
              <p className="text-sm text-stone-500">
                Select food items, beverages, or combo meals from any restaurant menu to start your order.
              </p>
              <button
                type="button"
                onClick={() => {
                  try {
                    system.calculateBillPreview(deliveryMode);
                  } catch (err) {
                    const msg = onRecordError(err);
                    setErrorMsg(msg);
                  }
                }}
                className="mt-2 px-3.5 py-2 rounded-xl border border-[#E7DFD3] text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                Test EmptyCartException
              </button>
              {errorMsg && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-left">
                  {errorMsg}
                </div>
              )}
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-5">
              {(errorMsg || deliveryError) && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg || deliveryError}</span>
                </div>
              )}

              {isSupabaseActive && !isAuthenticated && (
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                    <span>Sign in with Supabase Auth to verify your customer account before checkout.</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 text-white font-semibold shrink-0 cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Cart Items */}
              <div className="rounded-2xl bg-white border border-[#E7DFD3] divide-y divide-[#F3EDE3]">
                {cartEntries.map((entry) => {
                  const unitPrice = entry.item.calculateUnitPrice(entry.customization);
                  const lineTotal = unitPrice * entry.quantity;
                  return (
                    <div key={entry.key} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FoodArtwork
                          kind={entry.item.illustration}
                          itemName={entry.item.name}
                          itemId={entry.item.id}
                          className="w-14 h-14 rounded-xl shadow-2xs border border-[#E7DFD3] shrink-0"
                        />
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <VegIndicator isVeg={entry.item.isVegetarian} />
                            <span className="font-semibold text-sm text-stone-900 truncate">
                              {entry.item.name}
                            </span>
                            <ItemTypeBadge type={entry.item.getItemType()} />
                          </div>
                          <p className="text-xs text-stone-500">
                            {entry.item.getCustomizationSummary(entry.customization)}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            {formatCurrency(unitPrice)} × {entry.quantity} • Pack:{' '}
                            {formatCurrency(entry.item.getPackagingFee() * entry.quantity)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="inline-flex items-center rounded-lg border border-[#E7DFD3] bg-[#FAF7F2]">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(entry.key, -1)}
                            className="p-1.5 text-stone-700 hover:bg-stone-200/60 rounded-l-lg cursor-pointer"
                            aria-label="Decrease"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center font-mono-code text-xs font-bold">
                            {entry.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(entry.key, 1)}
                            className="p-1.5 text-stone-700 hover:bg-stone-200/60 rounded-r-lg cursor-pointer"
                            aria-label="Increase"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="font-mono-code text-sm font-bold text-stone-900">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Mode Strategy */}
              <div className="rounded-2xl bg-white border border-[#E7DFD3] p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                  <Bike className="w-4 h-4 text-[#D94E28]" />
                  Delivery Strategy (Polymorphic Fee &amp; ETA)
                </div>
                <div className="space-y-2">
                  {(Object.keys(DELIVERY_STRATEGIES) as DeliveryModeId[]).map((modeId) => {
                    const strat = DELIVERY_STRATEGIES[modeId];
                    let feeDisplay = '';
                    let unavailable = false;
                    if (cartRestaurant) {
                      try {
                        const subtotal = cartEntries.reduce(
                          (s, e) => s + e.item.calculateLineSubtotal(e.quantity, e.customization),
                          0,
                        );
                        const fee = strat.calculateFee(cartRestaurant.distanceKm, subtotal);
                        feeDisplay = fee === 0 ? 'FREE' : formatCurrency(fee);
                      } catch {
                        feeDisplay = 'Max 5km';
                        unavailable = true;
                      }
                    }

                    return (
                      <button
                        key={modeId}
                        type="button"
                        onClick={() => {
                          setDeliveryMode(modeId);
                          setErrorMsg(null);
                          if (unavailable && cartRestaurant) {
                            try {
                              strat.calculateFee(cartRestaurant.distanceKm, 0);
                            } catch (err) {
                              setErrorMsg(onRecordError(err));
                            }
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                          deliveryMode === modeId
                            ? 'border-[#D94E28] bg-[#D94E28]/5'
                            : 'border-[#E7DFD3] hover:border-stone-400'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-semibold text-stone-900">{strat.label}</div>
                          <div className="text-xs text-stone-500">{strat.description}</div>
                        </div>
                        <span
                          className={`font-mono-code text-xs font-bold ${
                            unavailable
                              ? 'text-red-600'
                              : feeDisplay === 'FREE'
                                ? 'text-emerald-700'
                                : 'text-stone-900'
                          }`}
                        >
                          {feeDisplay}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Promo Code */}
              <div className="rounded-2xl bg-white border border-[#E7DFD3] p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
                    <Tag className="w-3.5 h-3.5 text-[#D94E28]" />
                    Promo Code
                  </span>
                  <div className="flex items-center gap-1.5">
                    {system.getAvailablePromos().map((offer) => (
                      <button
                        key={offer.code}
                        type="button"
                        onClick={() => handleApplyPromo(offer.code)}
                        className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E7DFD3] font-mono-code text-[11px] font-semibold text-stone-700 hover:border-[#D94E28] cursor-pointer"
                      >
                        {offer.code}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter promo code (e.g. GROUP13)"
                    className="flex-1 rounded-xl border border-[#E7DFD3] px-3 py-2 text-sm font-mono-code uppercase focus:outline-none focus:ring-2 focus:ring-[#D94E28]/30"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyPromo()}
                    className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {appliedPromo && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Code {appliedPromo} applied!
                  </p>
                )}
              </div>

              {/* Customer & Delivery Details */}
              <div className="rounded-2xl bg-white border border-[#E7DFD3] p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Customer &amp; Delivery Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full rounded-xl border border-[#E7DFD3] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-[#E7DFD3] px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#E7DFD3] px-3 py-2 text-sm"
                    />
                  </div>

                  {/* Auto-Location Fetch from Pincode */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-stone-600">
                        Pincode (Auto-fetch Location)
                      </label>
                      {pincodeLoading && (
                        <span className="flex items-center gap-1 text-[10px] text-[#D94E28] font-semibold animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Locating...
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        placeholder="e.g. 700017"
                        className="w-full rounded-xl border border-[#E7DFD3] px-3 py-2 pr-8 text-sm font-mono-code focus:outline-none focus:ring-2 focus:ring-[#D94E28]/30"
                      />
                      <MapPin className="w-4 h-4 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Pincode status banner */}
                {pincodeCity && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Detected location: <strong>{pincodeCity}</strong> (added to address)
                    </span>
                  </div>
                )}
                {pincodeError && (
                  <p className="text-[11px] text-amber-700 px-1">{pincodeError}</p>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Delivery Street Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Flat No., Road, Area"
                    className="w-full rounded-xl border border-[#E7DFD3] px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full rounded-xl border border-[#E7DFD3] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Delivery Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Leave at gate / call on arrival"
                      className="w-full rounded-xl border border-[#E7DFD3] px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Option: Online vs Cash on Delivery (COD) */}
              <div className="rounded-2xl bg-white border border-[#E7DFD3] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Payment Method
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    COD Available
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                      paymentMethod === 'online'
                        ? 'border-[#D94E28] bg-[#D94E28]/5 ring-1 ring-[#D94E28]'
                        : 'border-[#E7DFD3] hover:border-stone-400'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        paymentMethod === 'online' ? 'bg-[#D94E28] text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">Pay Online</div>
                      <div className="text-[11px] text-stone-500">UPI, Cards, Net Banking</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                      paymentMethod === 'cod'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                        : 'border-[#E7DFD3] hover:border-stone-400'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        paymentMethod === 'cod' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <span>Cash on Delivery</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          COD
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500">Pay cash or UPI to rider</div>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'cod' && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900">
                    <Wallet className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                    <span>Pay in cash or scan QR code when your food arrives. No advance payment needed!</span>
                  </div>
                )}
              </div>

              {/* Total Bill Summary */}
              {billPreview && (
                <div className="rounded-2xl bg-white border border-[#E7DFD3] p-4 space-y-2 text-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 pb-1">
                    Bill Breakdown
                  </h3>
                  <div className="flex justify-between text-stone-600">
                    <span>Items Subtotal</span>
                    <span className="font-mono-code">{formatCurrency(billPreview.bill.itemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Restaurant Packaging</span>
                    <span className="font-mono-code">
                      {formatCurrency(billPreview.bill.totalPackagingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Delivery Fee ({DELIVERY_STRATEGIES[deliveryMode].label})</span>
                    <span className="font-mono-code">
                      {billPreview.bill.deliveryFee === 0
                        ? 'FREE'
                        : formatCurrency(billPreview.bill.deliveryFee)}
                    </span>
                  </div>
                  {billPreview.bill.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Promo Discount ({billPreview.bill.appliedPromoCode})</span>
                      <span className="font-mono-code">
                        -{formatCurrency(billPreview.bill.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span>GST (5%)</span>
                    <span className="font-mono-code">{formatCurrency(billPreview.bill.taxAmount)}</span>
                  </div>
                  <div className="border-t border-[#E7DFD3] pt-2.5 mt-2 flex justify-between items-center text-base font-bold text-stone-900">
                    <span>Grand Total</span>
                    <span className="font-mono-code text-lg">
                      {formatCurrency(billPreview.bill.grandTotal)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 pt-1">
                    Estimated delivery time: <span className="font-semibold">{billPreview.estimatedMinutes} mins</span>
                  </p>
                </div>
              )}
            </form>
          )}
        </div>

        {cartEntries.length > 0 && (
          <div className="p-5 bg-white border-t border-[#E7DFD3]">
            <button
              type="submit"
              form="checkout-form"
              disabled={!billPreview}
              className={`w-full py-3.5 px-5 rounded-2xl disabled:opacity-50 text-white font-bold text-sm shadow-sm transition cursor-pointer flex items-center justify-center gap-2 ${
                paymentMethod === 'cod'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-[#D94E28] hover:bg-[#B63B19]'
              }`}
            >
              {billPreview ? (
                paymentMethod === 'cod' ? (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Confirm Order • Pay {formatCurrency(billPreview.bill.grandTotal)} on Delivery</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Online • {formatCurrency(billPreview.bill.grandTotal)}</span>
                  </>
                )
              ) : (
                'Select Valid Delivery Option to Continue'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

