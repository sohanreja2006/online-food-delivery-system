import React from 'react';
import { MenuItemType } from '../models/MenuItem';
import { ORDER_STATUS_LABELS, OrderStatus } from '../models/Order';

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ITEM_TYPE_STYLES: Record<MenuItemType, string> = {
  Dish: 'bg-amber-50 text-amber-800 border-amber-200',
  Beverage: 'bg-sky-50 text-sky-800 border-sky-200',
  Combo: 'bg-orange-50 text-orange-800 border-orange-200',
};

export const ItemTypeBadge: React.FC<{ type: MenuItemType }> = ({ type }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ITEM_TYPE_STYLES[type]}`}
  >
    {type}
  </span>
);

const STATUS_STYLES: Record<OrderStatus, string> = {
  PLACED: 'bg-stone-100 text-stone-700 border-stone-300',
  CONFIRMED: 'bg-sky-50 text-sky-800 border-sky-200',
  PREPARING: 'bg-amber-50 text-amber-800 border-amber-200',
  OUT_FOR_DELIVERY: 'bg-orange-50 text-orange-800 border-orange-200',
  DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[status]}`}
  >
    {ORDER_STATUS_LABELS[status]}
  </span>
);

