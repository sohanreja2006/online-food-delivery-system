import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  LogIn,
  Receipt,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { CartDrawer, PaymentMethod } from './components/CartDrawer';
import { DeliveryAnimation } from './components/DeliveryAnimation';
import { ManageSystemView } from './components/ManageSystemView';
import { OrdersView } from './components/OrdersView';
import { RestaurantView } from './components/RestaurantView';
import { AuthUserProfile, SupabaseAuthService } from './models/AuthService';
import { MixedRestaurantOrderException } from './models/Exceptions';
import { FoodDeliverySystem } from './models/FoodDeliverySystem';
import { ItemCustomization } from './models/MenuItem';
import { ORDER_STATUS_LABELS, OrderSummary } from './models/Order';
import { isSupabaseConfigured } from './services/supabaseClient';

type ActiveTab = 'browse' | 'orders' | 'manage';

interface ToastState {
  id: number;
  kind: 'success' | 'error';
  title: string;
  message: string;
}

interface PendingSwitchState {
  restaurantId: string;
  itemId: string;
  quantity: number;
  customization?: ItemCustomization;
  currentRestaurantName: string;
  attemptedRestaurantName: string;
}

export const App: React.FC = () => {
  const systemRef = useRef<FoodDeliverySystem | null>(null);
  if (!systemRef.current) {
    systemRef.current = new FoodDeliverySystem({ seedSampleOrder: true });
  }
  const system = systemRef.current;

  const authServiceRef = useRef<SupabaseAuthService | null>(null);
  if (!authServiceRef.current) {
    authServiceRef.current = new SupabaseAuthService();
  }
  const authService = authServiceRef.current;

  const [, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('browse');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authProfile, setAuthProfile] = useState<AuthUserProfile | null>(null);
  const [supabaseConfigTick, setSupabaseConfigTick] = useState(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitchState | null>(null);
  const [deliveryAnimation, setDeliveryAnimation] = useState<{
    restaurantName: string;
    orderId: string;
    estimatedMinutes: number;
    grandTotal: number;
    paymentMethod: PaymentMethod;
  } | null>(null);

  useEffect(() => {
    let active = true;
    authService
      .getCurrentSession()
      .then(({ profile }) => {
        if (!active) {
          return;
        }
        setAuthProfile(profile);
        system.syncAuthenticatedCustomer(profile);
        refresh();
      })
      .catch(() => {
        // Ignore initial background session check failures when offline
      });

    const unsubscribe = authService.subscribeAuthChanges((profile) => {
      if (!active) {
        return;
      }
      setAuthProfile(profile);
      system.syncAuthenticatedCustomer(profile);
      refresh();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [authService, system, refresh, supabaseConfigTick]);

  const showToast = useCallback((kind: 'success' | 'error', title: string, message: string) => {
    setToast({ id: Date.now(), kind, title, message });
  }, []);

  // Auto-dismiss bottom-right notification toast after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleRecordError = useCallback(
    (error: unknown): string => {
      const msg = system.recordException(error);
      const name = error instanceof Error ? error.name : 'SystemException';
      showToast('error', name, msg);
      refresh();
      return msg;
    },
    [system, showToast, refresh],
  );

  const handleAddToCart = (
    restaurantId: string,
    itemId: string,
    quantity: number,
    customization?: ItemCustomization,
    forceSwitch = false,
  ) => {
    try {
      const added = system.addToCart(restaurantId, itemId, quantity, customization, forceSwitch);
      showToast(
        'success',
        'Added to Cart',
        `${added.item.name} (${added.quantity} in cart) from ${system.getRestaurant(restaurantId).name}.`,
      );
      setPendingSwitch(null);
      refresh();
    } catch (err) {
      if (err instanceof MixedRestaurantOrderException) {
        system.recordException(err);
        setPendingSwitch({
          restaurantId,
          itemId,
          quantity,
          customization,
          currentRestaurantName: err.currentRestaurantName,
          attemptedRestaurantName: err.attemptedRestaurantName,
        });
        refresh();
        return;
      }
      handleRecordError(err);
    }
  };

  const handleUpdateCartQty = (entryKey: string, delta: number) => {
    try {
      system.updateCartQuantity(entryKey, delta);
      refresh();
    } catch (err) {
      handleRecordError(err);
    }
  };

  const handleClearCart = () => {
    system.clearCart();
    showToast('success', 'Cart Cleared', 'All items removed from your cart.');
    refresh();
  };

  const handleOrderPlaced = (
    summary: OrderSummary,
    savedDetails: { name: string; phone: string; address: string; landmark: string },
    paymentMethod: PaymentMethod = 'online',
  ) => {
    setIsCartOpen(false);
    setSelectedOrderId(summary.orderId);
    setActiveTab('orders');
    if (authProfile) {
      authService
        .updateUserProfileMetadata({
          fullName: savedDetails.name,
          phone: savedDetails.phone,
          address: savedDetails.address,
          landmark: savedDetails.landmark,
        })
        .catch(() => undefined);
    }
    setDeliveryAnimation({
      restaurantName: summary.restaurantName,
      orderId: summary.orderId,
      estimatedMinutes: summary.delivery.estimatedMinutes,
      grandTotal: summary.bill.grandTotal,
      paymentMethod,
    });
    showToast(
      'success',
      `Order ${summary.orderId} Placed!`,
      `Earned +${summary.pointsEarned} loyalty points. Tracking live from ${summary.restaurantName}.`,
    );
    refresh();
  };

  const handleAdvanceOrder = (orderId: string) => {
    try {
      const nextStatus = system.advanceOrderStatus(orderId);
      showToast('success', 'Order Status Updated', `${orderId} is now ${ORDER_STATUS_LABELS[nextStatus]}.`);
      refresh();
    } catch (err) {
      handleRecordError(err);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    try {
      system.cancelOrder(orderId);
      showToast('success', 'Order Cancelled', `${orderId} has been cancelled.`);
      refresh();
    } catch (err) {
      handleRecordError(err);
    }
  };

  const handleToggleFavorite = (restaurantId: string) => {
    try {
      const nowFav = system.toggleFavoriteRestaurant(restaurantId);
      const rest = system.getRestaurant(restaurantId);
      showToast(
        'success',
        nowFav ? 'Saved to Favorites' : 'Removed from Favorites',
        `${rest.name} ${nowFav ? 'added to' : 'removed from'} your favorites Set.`,
      );
      refresh();
    } catch (err) {
      handleRecordError(err);
    }
  };

  const cartCount = system.getCartItemCount();
  const ordersCount = system.getAllOrderSummaries().length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-stone-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E7DFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('browse');
              setSelectedRestaurantId(null);
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <span className="w-9 h-9 rounded-xl bg-[#D94E28] text-white flex items-center justify-center shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </span>
            <div>
              <div className="font-display text-2xl leading-none text-stone-900">
                Saffron &amp; Fork
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mt-0.5">
                Group 13 • Food Delivery System
              </div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-2xl border border-[#E7DFD3]">
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Browse &amp; Order
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Orders &amp; Summary
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-stone-200 text-stone-800 font-mono-code">
                {ordersCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'manage'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Manage System
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#E7DFD3] text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-semibold text-stone-800">
                {system.customer.name.split(' ')[0]}
              </span>
              <span className="font-mono-code text-stone-500">
                {system.customer.loyaltyPoints} pts
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold border transition cursor-pointer ${
                authProfile
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-stone-800 border-[#E7DFD3] hover:border-stone-400'
              }`}
            >
              {authProfile ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="max-w-[110px] truncate">{authProfile.fullName}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-[#D94E28]" />
                  <span>Sign In</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-900 hover:bg-[#D94E28] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 font-mono-code text-[11px]">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden border-t border-[#E7DFD3] px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#FAF7F2]">
          {(
            [
              { id: 'browse', label: 'Browse' },
              { id: 'orders', label: `Orders (${ordersCount})` },
              { id: 'manage', label: 'Manage' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
                activeTab === tab.id ? 'bg-stone-900 text-white' : 'bg-white text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">
        {activeTab === 'browse' && (
          <RestaurantView
            system={system}
            selectedRestaurantId={selectedRestaurantId}
            onSelectRestaurant={setSelectedRestaurantId}
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            system={system}
            selectedOrderId={selectedOrderId}
            onSelectOrder={setSelectedOrderId}
            onAdvanceOrder={handleAdvanceOrder}
            onCancelOrder={handleCancelOrder}
          />
        )}

        {activeTab === 'manage' && (
          <ManageSystemView
            system={system}
            onSystemMutated={(msg) => {
              if (msg) {
                showToast('success', 'System Updated', msg);
              }
              refresh();
            }}
            onSyncAuthMetadata={(details) => {
              if (authProfile) {
                authService
                  .updateUserProfileMetadata(details)
                  .then((updated) => {
                    if (updated) {
                      setAuthProfile(updated);
                    }
                  })
                  .catch((err) => handleRecordError(err));
              }
            }}
            onRecordError={handleRecordError}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-[#E7DFD3] bg-white/70 py-5 px-4 text-center text-xs text-stone-500 no-print">
        Online Food Delivery System • Group 13 (Adnan Sadique, Ahammed Sohan Raja, Abdus Samad Sk,
        Md Taufique Anwar Ansari) • Built with React, TypeScript &amp; OOP Architecture
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        system={system}
        isOpen={isCartOpen}
        isSupabaseActive={isSupabaseConfigured()}
        isAuthenticated={Boolean(authProfile)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onClose={() => setIsCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
        onRecordError={handleRecordError}
      />

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        authService={authService}
        currentProfile={authProfile}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(profile, message) => {
          setAuthProfile(profile);
          system.syncAuthenticatedCustomer(profile);
          setIsAuthOpen(false);
          showToast('success', 'Authentication', message);
          refresh();
        }}
        onSupabaseConfigured={() => {
          setSupabaseConfigTick((t) => t + 1);
          refresh();
        }}
        onRecordError={handleRecordError}
      />

      {/* Mixed Restaurant Exception Recovery Modal */}
      {pendingSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E7DFD3] p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-5 h-5" />
              </span>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">Replace items in cart?</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Caught <span className="font-mono-code font-semibold">MixedRestaurantOrderException</span>:
                  your cart currently contains items from{' '}
                  <span className="font-semibold">{pendingSwitch.currentRestaurantName}</span>. Would you
                  like to discard them and start a fresh cart from{' '}
                  <span className="font-semibold">{pendingSwitch.attemptedRestaurantName}</span>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingSwitch(null)}
                className="px-4 py-2 rounded-xl border border-[#E7DFD3] text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Keep Current Cart
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddToCart(
                    pendingSwitch.restaurantId,
                    pendingSwitch.itemId,
                    pendingSwitch.quantity,
                    pendingSwitch.customization,
                    true,
                  )
                }
                className="px-4 py-2 rounded-xl bg-[#D94E28] hover:bg-[#B63B19] text-white text-xs font-semibold cursor-pointer"
              >
                Start Fresh Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Animation Overlay */}
      {deliveryAnimation && (
        <DeliveryAnimation
          isVisible={Boolean(deliveryAnimation)}
          restaurantName={deliveryAnimation.restaurantName}
          orderId={deliveryAnimation.orderId}
          estimatedMinutes={deliveryAnimation.estimatedMinutes}
          grandTotal={deliveryAnimation.grandTotal}
          paymentMethod={deliveryAnimation.paymentMethod}
          onDismiss={() => setDeliveryAnimation(null)}
        />
      )}

      {/* Toast Notification with 5s countdown timer */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] no-print animate-fadeIn">
          <div
            className={`relative overflow-hidden rounded-2xl p-4 shadow-xl border flex items-start gap-3 ${
              toast.kind === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-stone-900 border-stone-800 text-white'
            }`}
          >
            {toast.kind === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0 pb-1">
              <div className="text-xs font-bold font-mono-code">{toast.title}</div>
              <p
                className={`text-xs mt-0.5 leading-snug ${
                  toast.kind === 'error' ? 'text-red-800' : 'text-stone-300'
                }`}
              >
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss message"
              className="p-1 rounded-lg opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 5-second countdown progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
              <div
                key={toast.id}
                className={`h-full ${
                  toast.kind === 'error' ? 'bg-red-500' : 'bg-emerald-400'
                }`}
                style={{
                  animation: 'toastCountdown 5s linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

