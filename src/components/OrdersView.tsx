import React from 'react';
import {
  ArrowRight,
  Ban,
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Printer,
  Receipt,
  Sparkles,
  User,
} from 'lucide-react';
import { FoodDeliverySystem } from '../models/FoodDeliverySystem';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_SEQUENCE,
  OrderSummary,
} from '../models/Order';
import { FoodArtwork, VegIndicator } from './FoodArtwork';
import { formatCurrency, formatTime, ItemTypeBadge, OrderStatusBadge } from './uiBadges';

interface OrdersViewProps {
  system: FoodDeliverySystem;
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  onAdvanceOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  system,
  selectedOrderId,
  onSelectOrder,
  onAdvanceOrder,
  onCancelOrder,
}) => {
  const orders = system.getAllOrderSummaries();
  const activeSummary: OrderSummary | undefined =
    orders.find((o) => o.orderId === selectedOrderId) ?? orders[0];

  if (orders.length === 0 || !activeSummary) {
    return (
      <div className="rounded-3xl bg-white border border-[#E7DFD3] p-12 text-center space-y-3">
        <Receipt className="w-10 h-10 text-stone-300 mx-auto" />
        <h2 className="text-xl font-bold text-stone-900">No orders placed yet</h2>
        <p className="text-sm text-stone-500 max-w-md mx-auto">
          Browse a restaurant menu, select food items, and place an order to see live order status
          tracking and the generated order summary.
        </p>
      </div>
    );
  }

  const currentStepIdx = ORDER_STATUS_SEQUENCE.indexOf(activeSummary.status);
  const isCancelled = activeSummary.status === 'CANCELLED';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Order History List */}
      <aside className="lg:col-span-4 space-y-3 no-print">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            All Orders ({orders.length})
          </h2>
        </div>

        <div className="space-y-2.5">
          {orders.map((order) => {
            const isSelected = order.orderId === activeSummary.orderId;
            return (
              <button
                key={order.orderId}
                type="button"
                onClick={() => onSelectOrder(order.orderId)}
                className={`w-full text-left rounded-2xl p-4 border transition cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#D94E28] shadow-sm ring-2 ring-[#D94E28]/15'
                    : 'bg-white/80 border-[#E7DFD3] hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono-code text-xs font-bold text-stone-900">
                    {order.orderId}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="font-semibold text-sm text-stone-900">{order.restaurantName}</div>
                <div className="text-xs text-stone-500 mt-0.5">
                  {order.items.reduce((s, i) => s + i.quantity, 0)} items •{' '}
                  {formatCurrency(order.bill.grandTotal)} • {formatTime(order.createdAt)}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right: Live Order Summary & Status Lifecycle */}
      <section className="lg:col-span-8 rounded-3xl bg-white border border-[#E7DFD3] shadow-xs overflow-hidden">
        <div className="p-6 sm:p-7 border-b border-[#E7DFD3] bg-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono-code text-sm font-bold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-[#E7DFD3]">
                {activeSummary.orderId}
              </span>
              <OrderStatusBadge status={activeSummary.status} />
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Sparkles className="w-3 h-3" />+{activeSummary.pointsEarned} loyalty pts
              </span>
            </div>
            <h1 className="font-display text-3xl text-stone-900 mt-2">
              {activeSummary.restaurantName}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {activeSummary.restaurantAddress} • Placed at {formatTime(activeSummary.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-1.5 self-start px-3.5 py-2 rounded-xl bg-white border border-[#E7DFD3] text-xs font-semibold text-stone-700 hover:border-stone-400 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Order Summary
          </button>
        </div>

        {/* Status Progress Stepper */}
        <div className="p-6 sm:p-7 border-b border-[#E7DFD3] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Order Status &amp; State Machine
            </h3>
            <div className="flex flex-wrap items-center gap-2 no-print">
              <button
                type="button"
                onClick={() => onAdvanceOrder(activeSummary.orderId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-[#D94E28] text-white text-xs font-semibold transition cursor-pointer"
              >
                Advance Status
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onCancelOrder(activeSummary.orderId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel Order
              </button>
            </div>
          </div>

          {!isCancelled ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {ORDER_STATUS_SEQUENCE.map((step, idx) => {
                const done = idx <= currentStepIdx;
                const current = idx === currentStepIdx;
                return (
                  <div
                    key={step}
                    className={`rounded-xl p-3 border text-center transition ${
                      current
                        ? 'bg-[#D94E28]/10 border-[#D94E28] text-[#B63B19]'
                        : done
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      {done ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                    <div className="text-[11px] font-bold leading-tight">
                      {ORDER_STATUS_LABELS[step]}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800">
              This order has been cancelled. Attempting further state transitions triggers{' '}
              <span className="font-mono-code font-semibold">OrderStateTransitionException</span>.
            </div>
          )}

          <p className="text-[11px] text-stone-500 no-print">
            Tip: Try clicking <span className="font-semibold">Cancel Order</span> after status reaches{' '}
            <span className="font-semibold">Out for Delivery</span> or{' '}
            <span className="font-semibold">Advance Status</span> on a Delivered/Cancelled order to test
            encapsulated <span className="font-mono-code">OrderStateTransitionException</span> handling.
          </p>
        </div>

        {/* Customer & Delivery Details */}
        <div className="p-6 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-[#E7DFD3]">
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
              <User className="w-3.5 h-3.5 text-[#D94E28]" />
              Customer &amp; Drop-off Details
            </div>
            <div className="rounded-2xl bg-[#FAF7F2] border border-[#E7DFD3] p-4 space-y-1.5 text-xs text-stone-700">
              <div className="font-bold text-sm text-stone-900">{activeSummary.delivery.recipientName}</div>
              <div>{activeSummary.delivery.phone} • {activeSummary.customerEmail}</div>
              <div className="flex items-start gap-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 text-[#D94E28] shrink-0 mt-0.5" />
                <span>
                  {activeSummary.delivery.address}
                  {activeSummary.delivery.landmark ? ` (${activeSummary.delivery.landmark})` : ''}
                </span>
              </div>
              {activeSummary.delivery.instructions && (
                <div className="text-stone-500 italic pt-1">
                  Note: “{activeSummary.delivery.instructions}”
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
              <Bike className="w-3.5 h-3.5 text-[#D94E28]" />
              Delivery Partner &amp; Strategy
            </div>
            <div className="rounded-2xl bg-[#FAF7F2] border border-[#E7DFD3] p-4 space-y-1.5 text-xs text-stone-700">
              <div className="font-bold text-sm text-stone-900">
                {activeSummary.delivery.assignedPartner.name}
              </div>
              <div>{activeSummary.delivery.assignedPartner.getProfileSummary()}</div>
              <div>
                Mode: <span className="font-semibold">{activeSummary.delivery.strategy.label}</span> (
                {activeSummary.delivery.distanceKm} km)
              </div>
              <div>
                Estimated Arrival:{' '}
                <span className="font-semibold text-emerald-700">
                  {activeSummary.delivery.estimatedMinutes} mins
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Order Summary & Bill */}
        <div className="p-6 sm:p-7 space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Itemized Order Summary
          </h3>
          <div className="rounded-2xl border border-[#E7DFD3] divide-y divide-[#F3EDE3]">
            {activeSummary.items.map((item, idx) => (
              <div key={`${item.itemId}-${idx}`} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FoodArtwork
                    kind={item.illustration}
                    itemName={item.name}
                    itemId={item.itemId}
                    className="w-12 h-12 rounded-xl shadow-2xs border border-[#E7DFD3] shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <VegIndicator isVeg={item.isVegetarian} />
                      <span className="font-semibold text-sm text-stone-900 truncate">
                        {item.quantity} × {item.name}
                      </span>
                      <ItemTypeBadge type={item.itemType} />
                    </div>
                    <p className="text-xs text-stone-500">{item.customizationSummary}</p>
                    <p className="text-[11px] text-stone-400">
                      Unit: {formatCurrency(item.unitPrice)} • Packaging:{' '}
                      {formatCurrency(item.linePackagingFee)}
                    </p>
                  </div>
                </div>
                <span className="font-mono-code text-sm font-bold text-stone-900 shrink-0">
                  {formatCurrency(item.lineSubtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Timeline Log */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Status History Log
              </h4>
              <div className="space-y-2 border-l-2 border-[#E7DFD3] pl-3.5">
                {activeSummary.statusHistory.map((log, idx) => (
                  <div key={`${log.status}-${idx}`} className="text-xs">
                    <div className="font-semibold text-stone-800">
                      {ORDER_STATUS_LABELS[log.status]}{' '}
                      <span className="font-mono-code text-[11px] font-normal text-stone-400">
                        • {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <div className="text-stone-500">{log.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Bill */}
            <div className="rounded-2xl bg-[#FAF7F2] border border-[#E7DFD3] p-4 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span className="font-mono-code">
                  {formatCurrency(activeSummary.bill.itemsSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Packaging Fees</span>
                <span className="font-mono-code">
                  {formatCurrency(activeSummary.bill.totalPackagingFee)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery Fee</span>
                <span className="font-mono-code">
                  {activeSummary.bill.deliveryFee === 0
                    ? 'FREE'
                    : formatCurrency(activeSummary.bill.deliveryFee)}
                </span>
              </div>
              {activeSummary.bill.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount ({activeSummary.bill.appliedPromoCode})</span>
                  <span className="font-mono-code">
                    -{formatCurrency(activeSummary.bill.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>GST (5%)</span>
                <span className="font-mono-code">{formatCurrency(activeSummary.bill.taxAmount)}</span>
              </div>
              <div className="border-t border-[#E7DFD3] pt-2.5 flex justify-between items-center font-bold text-stone-900">
                <span>Total Paid</span>
                <span className="font-mono-code text-lg">
                  {formatCurrency(activeSummary.bill.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

