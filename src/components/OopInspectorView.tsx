import React from 'react';
import {
  AlertTriangle,
  Boxes,
  Code2,
  Database,
  GitBranch,
  Layers,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { FoodDeliverySystem } from '../models/FoodDeliverySystem';
import { formatTime } from './uiBadges';

interface OopInspectorViewProps {
  system: FoodDeliverySystem;
  onTriggerExceptionTest: (fn: () => void) => void;
}

const GROUP_13_MEMBERS = [
  { roll: '146', name: 'Adnan Sadique', sl: '51' },
  { roll: '147', name: 'Ahammed Sohan Raja', sl: '52' },
  { roll: '148', name: 'Abdus Samad Sk', sl: '53' },
  { roll: '144', name: 'Md Taufique Anwar Ansari', sl: '54' },
];

const OOP_PILLARS = [
  {
    title: 'Classes & Objects',
    file: 'src/models/*.ts',
    icon: Boxes,
    description:
      'Dedicated domain classes instantiated at runtime: Customer, DeliveryPartner, Restaurant, Menu, DishItem, BeverageItem, ComboMeal, OrderItem, DeliveryDetails, Order, and FoodDeliverySystem.',
  },
  {
    title: 'Encapsulation',
    file: 'src/models/Person.ts & Order.ts',
    icon: ShieldCheck,
    description:
      'Private fields (_name, _phone, _email, _basePrice, _status, _isOpen) protected behind validated getters/setters and controlled mutation methods.',
  },
  {
    title: 'Inheritance',
    file: 'src/models/Person.ts, MenuItem.ts, Exceptions.ts',
    icon: GitBranch,
    description:
      'Abstract bases Person → Customer / DeliveryPartner, MenuItem → DishItem / BeverageItem / ComboMeal, DeliveryStrategy → Standard / Express / EcoCycle, and DeliverySystemException → 8 custom exceptions.',
  },
  {
    title: 'Polymorphism',
    file: 'src/models/MenuItem.ts & DeliveryStrategy.ts',
    icon: Layers,
    description:
      'Overridden calculateUnitPrice(), getPackagingFee(), getCustomizationSummary(), and DeliveryStrategy.calculateFee() / estimateMinutes() invoked uniformly across MenuItem & DeliveryStrategy references.',
  },
  {
    title: 'Collections',
    file: 'src/models/Restaurant.ts & FoodDeliverySystem.ts',
    icon: Database,
    description:
      'Map<string, Restaurant>, Map<string, MenuItem>, Map<string, Order>, Map<string, CartEntry>, Set<string> cuisines, Set<string> favorites, and typed history arrays.',
  },
  {
    title: 'Exception Handling & Auth',
    file: 'src/models/Exceptions.ts & AuthService.ts',
    icon: AlertTriangle,
    description:
      'Structured try/catch error boundaries handling ValidationException, InvalidQuantityException, ItemUnavailableException, RestaurantClosedException, MixedRestaurantOrderException, EmptyCartException, OrderStateTransitionException, and Supabase AuthenticationException.',
  },
];

export const OopInspectorView: React.FC<OopInspectorViewProps> = ({
  system,
  onTriggerExceptionTest,
}) => {
  const telemetry = system.getCollectionTelemetry();
  const exceptionLog = system.getExceptionLog();

  return (
    <div className="space-y-8">
      {/* Project Header & Group 13 Roster */}
      <section className="rounded-3xl bg-white border border-[#E7DFD3] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D94E28]/10 text-[#B63B19]">
              <Code2 className="w-3.5 h-3.5" />
              Group 13 • Object-Oriented React Architecture
            </span>
            <h1 className="font-display text-3xl sm:text-4xl text-stone-900">
              Online Food Delivery System — Live OOP Inspector
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              Every storefront action, cart calculation, order lifecycle step, and validation rule in
              this React application executes directly through TypeScript OOP classes in{' '}
              <span className="font-mono-code text-stone-800">src/models/</span>.
            </p>
          </div>

          <div className="rounded-2xl bg-[#FAF7F2] border border-[#E7DFD3] p-4 min-w-[270px]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
              <Users className="w-3.5 h-3.5 text-[#D94E28]" />
              Group 13 Team Members
            </div>
            <div className="space-y-1.5">
              {GROUP_13_MEMBERS.map((m) => (
                <div key={m.roll} className="flex items-center justify-between gap-4 text-xs">
                  <span className="font-semibold text-stone-800">{m.name}</span>
                  <span className="font-mono-code text-stone-500">Roll {m.roll}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Collection Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-2xl bg-[#FAF7F2] border border-[#E7DFD3] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Restaurants Map
            </div>
            <div className="font-mono-code text-2xl font-bold text-stone-900 mt-1">
              {telemetry.restaurantsMapSize}
            </div>
            <div className="text-[11px] text-stone-500">
              {telemetry.totalMenuItemsInMenus} MenuItem objects
            </div>
          </div>

          <div className="rounded-2xl bg-[#FAF7F2] border border-[#E7DFD3] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Orders Map
            </div>
            <div className="font-mono-code text-2xl font-bold text-stone-900 mt-1">
              {telemetry.ordersMapSize}
            </div>
            <div className="text-[11px] text-stone-500">Order &amp; Summary records</div>
          </div>

          <div className="rounded-2xl bg-[#FAF7F2] border border-[#E7DFD3] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Active Sets &amp; Cart
            </div>
            <div className="font-mono-code text-2xl font-bold text-stone-900 mt-1">
              {telemetry.cuisinesSetSize} / {telemetry.favoritesSetSize}
            </div>
            <div className="text-[11px] text-stone-500">
              Cuisines Set / Favorites Set ({telemetry.cartMapSize} in cart)
            </div>
          </div>

          <div className="rounded-2xl bg-[#FAF7F2] border border-[#E7DFD3] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Caught Exceptions
            </div>
            <div className="font-mono-code text-2xl font-bold text-[#D94E28] mt-1">
              {telemetry.caughtExceptionsCount}
            </div>
            <div className="text-[11px] text-stone-500">Runtime try/catch captures</div>
          </div>
        </div>
      </section>

      {/* 6 OOP Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {OOP_PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article
              key={pillar.title}
              className="rounded-2xl bg-white border border-[#E7DFD3] p-5 space-y-2.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 font-bold text-stone-900">
                  <span className="p-2 rounded-xl bg-[#D94E28]/10 text-[#D94E28]">
                    <Icon className="w-4 h-4" />
                  </span>
                  {pillar.title}
                </div>
              </div>
              <p className="font-mono-code text-[11px] text-[#B63B19] bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E7DFD3]">
                {pillar.file}
              </p>
              <p className="text-xs text-stone-600 leading-relaxed">{pillar.description}</p>
            </article>
          );
        })}
      </section>

      {/* Interactive Exception Sandbox & Live Log */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-3xl bg-white border border-[#E7DFD3] p-6 space-y-4 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Interactive Exception Triggers</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Click any rule check below to intentionally trigger, catch, and log the custom domain
              exception.
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() =>
                onTriggerExceptionTest(() => {
                  system.customer.phone = '123';
                })
              }
              className="w-full text-left px-4 py-2.5 rounded-xl border border-[#E7DFD3] hover:border-[#D94E28] bg-[#FAF7F2] text-xs font-semibold text-stone-800 transition cursor-pointer"
            >
              1. Invalid Customer Phone → <span className="font-mono-code">ValidationException</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onTriggerExceptionTest(() => {
                  system.addToCart('rest-zaffran', 'zf-biryani', 25);
                })
              }
              className="w-full text-left px-4 py-2.5 rounded-xl border border-[#E7DFD3] hover:border-[#D94E28] bg-[#FAF7F2] text-xs font-semibold text-stone-800 transition cursor-pointer"
            >
              2. Quantity &gt; 20 → <span className="font-mono-code">InvalidQuantityException</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onTriggerExceptionTest(() => {
                  system.addToCart('rest-chai', 'cb-croissant', 1);
                })
              }
              className="w-full text-left px-4 py-2.5 rounded-xl border border-[#E7DFD3] hover:border-[#D94E28] bg-[#FAF7F2] text-xs font-semibold text-stone-800 transition cursor-pointer"
            >
              3. Sold-out Item → <span className="font-mono-code">ItemUnavailableException</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onTriggerExceptionTest(() => {
                  system.validatePromoCode('INVALID99');
                })
              }
              className="w-full text-left px-4 py-2.5 rounded-xl border border-[#E7DFD3] hover:border-[#D94E28] bg-[#FAF7F2] text-xs font-semibold text-stone-800 transition cursor-pointer"
            >
              4. Invalid Promo Code → <span className="font-mono-code">ValidationException</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onTriggerExceptionTest(() => {
                  system.getOrder('ORD-9999');
                })
              }
              className="w-full text-left px-4 py-2.5 rounded-xl border border-[#E7DFD3] hover:border-[#D94E28] bg-[#FAF7F2] text-xs font-semibold text-stone-800 transition cursor-pointer"
            >
              5. Missing Order ID → <span className="font-mono-code">EntityNotFoundException</span>
            </button>

            <button
              type="button"
              disabled={telemetry.isAuthenticated}
              onClick={() =>
                onTriggerExceptionTest(() => {
                  system.assertAuthenticatedForCheckout(true);
                })
              }
              className="w-full text-left px-4 py-2.5 rounded-xl border border-[#E7DFD3] hover:border-[#D94E28] disabled:opacity-60 bg-[#FAF7F2] text-xs font-semibold text-stone-800 transition cursor-pointer"
            >
              6. Unauthenticated Checkout →{' '}
              <span className="font-mono-code">
                {telemetry.isAuthenticated
                  ? 'Signed In (Sign out to test)'
                  : 'AuthenticationException'}
              </span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#E7DFD3] p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Live Caught Exception Log</h2>
              <p className="text-xs text-stone-500">
                Real-time history of domain exceptions caught in UI try/catch blocks.
              </p>
            </div>
            <span className="font-mono-code text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-semibold">
              {exceptionLog.length} logged
            </span>
          </div>

          {exceptionLog.length === 0 ? (
            <div className="rounded-2xl bg-[#FAF7F2] border border-dashed border-[#E7DFD3] p-8 text-center text-xs text-stone-500">
              No exceptions triggered yet. Click any test trigger on the left or try invalid inputs
              anywhere in the storefront!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {exceptionLog.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-red-50/70 border border-red-200/80 p-3.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-code font-bold text-red-800">{entry.name}</span>
                    <span className="font-mono-code text-[11px] text-red-600">
                      {entry.code} • {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-red-900">{entry.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

