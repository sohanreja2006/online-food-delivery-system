import { DeliveryStrategy } from './DeliveryStrategy';
import { OrderStateTransitionException, ValidationException } from './Exceptions';
import { IllustrationKind, ItemCustomization, MenuItem, MenuItemType } from './MenuItem';
import { Customer, DeliveryPartner } from './Person';

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export const ORDER_STATUS_SEQUENCE: readonly OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Order Placed',
  CONFIRMED: 'Kitchen Confirmed',
  PREPARING: 'Preparing Fresh',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/**
 * Immutable line-item snapshot captured at order placement so historical order bills
 * remain accurate even if menu prices change later.
 */
export class OrderItem {
  public readonly itemId: string;
  public readonly name: string;
  public readonly itemType: MenuItemType;
  public readonly isVegetarian: boolean;
  public readonly illustration: IllustrationKind;
  public readonly quantity: number;
  public readonly unitPrice: number;
  public readonly packagingFeePerUnit: number;
  public readonly taxRate: number;
  public readonly customizationSummary: string;
  public readonly lineSubtotal: number;
  public readonly linePackagingFee: number;
  public readonly lineTax: number;

  constructor(item: MenuItem, quantity: number, customization?: ItemCustomization) {
    item.assertOrderable(quantity);
    this.itemId = item.id;
    this.name = item.name;
    this.itemType = item.getItemType();
    this.isVegetarian = item.isVegetarian;
    this.illustration = item.illustration;
    this.quantity = quantity;
    this.unitPrice = item.calculateUnitPrice(customization);
    this.packagingFeePerUnit = item.getPackagingFee();
    this.taxRate = item.getTaxRate();
    this.customizationSummary = item.getCustomizationSummary(customization);
    this.lineSubtotal = this.unitPrice * quantity;
    this.linePackagingFee = this.packagingFeePerUnit * quantity;
    this.lineTax = Math.round(this.lineSubtotal * this.taxRate);
  }
}

export interface DeliveryDetailsInput {
  recipientName: string;
  phone: string;
  address: string;
  landmark?: string;
  instructions?: string;
  distanceKm: number;
  strategy: DeliveryStrategy;
  assignedPartner: DeliveryPartner;
  estimatedMinutes: number;
}

/**
 * Encapsulates delivery address, courier partner assignment, and chosen strategy.
 */
export class DeliveryDetails {
  public readonly recipientName: string;
  public readonly phone: string;
  public readonly address: string;
  public readonly landmark: string;
  public readonly instructions: string;
  public readonly distanceKm: number;
  public readonly strategy: DeliveryStrategy;
  public readonly assignedPartner: DeliveryPartner;
  public readonly estimatedMinutes: number;

  constructor(input: DeliveryDetailsInput) {
    if (input.recipientName.trim().length < 2) {
      throw new ValidationException('Recipient name must be at least 2 characters.');
    }
    const digits = input.phone.replace(/[\s\-+]/g, '');
    if (!/^\d{10,13}$/.test(digits)) {
      throw new ValidationException('Recipient phone number must contain 10 to 13 digits.');
    }
    if (input.address.trim().length < 8) {
      throw new ValidationException('Delivery address must be at least 8 characters.');
    }
    this.recipientName = input.recipientName.trim();
    this.phone = input.phone.trim();
    this.address = input.address.trim();
    this.landmark = input.landmark?.trim() ?? '';
    this.instructions = input.instructions?.trim() ?? '';
    this.distanceKm = input.distanceKm;
    this.strategy = input.strategy;
    this.assignedPartner = input.assignedPartner;
    this.estimatedMinutes = input.estimatedMinutes;
  }
}

export interface BillBreakdown {
  itemsSubtotal: number;
  totalPackagingFee: number;
  deliveryFee: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  appliedPromoCode?: string;
}

export interface StatusLogEntry {
  status: OrderStatus;
  timestamp: Date;
  note: string;
}

export interface OrderSummary {
  orderId: string;
  createdAt: Date;
  status: OrderStatus;
  statusLabel: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  items: readonly OrderItem[];
  delivery: DeliveryDetails;
  bill: BillBreakdown;
  statusHistory: readonly StatusLogEntry[];
  pointsEarned: number;
}

/**
 * Order entity managing line items, bill calculation, order summary generation,
 * and an encapsulated status state machine that guards against illegal transitions.
 */
export class Order {
  private readonly _orderId: string;
  private readonly _customer: Customer;
  private readonly _restaurantId: string;
  private readonly _restaurantName: string;
  private readonly _restaurantAddress: string;
  private readonly _items: OrderItem[];
  private readonly _deliveryDetails: DeliveryDetails;
  private readonly _bill: BillBreakdown;
  private readonly _createdAt: Date;
  private readonly _pointsEarned: number;
  private _status: OrderStatus;
  private readonly _statusHistory: StatusLogEntry[];

  constructor(params: {
    orderId: string;
    customer: Customer;
    restaurantId: string;
    restaurantName: string;
    restaurantAddress: string;
    items: OrderItem[];
    deliveryDetails: DeliveryDetails;
    bill: BillBreakdown;
    pointsEarned: number;
    initialStatus?: OrderStatus;
    createdAt?: Date;
  }) {
    this._orderId = params.orderId;
    this._customer = params.customer;
    this._restaurantId = params.restaurantId;
    this._restaurantName = params.restaurantName;
    this._restaurantAddress = params.restaurantAddress;
    this._items = [...params.items];
    this._deliveryDetails = params.deliveryDetails;
    this._bill = { ...params.bill };
    this._pointsEarned = params.pointsEarned;
    this._createdAt = params.createdAt ?? new Date();
    this._status = params.initialStatus ?? 'PLACED';
    this._statusHistory = [
      {
        status: 'PLACED',
        timestamp: this._createdAt,
        note: `Order received by ${this._restaurantName}`,
      },
    ];
    if (this._status !== 'PLACED') {
      const idx = ORDER_STATUS_SEQUENCE.indexOf(this._status);
      for (let i = 1; i <= idx; i += 1) {
        const step = ORDER_STATUS_SEQUENCE[i];
        this._statusHistory.push({
          status: step,
          timestamp: new Date(this._createdAt.getTime() + i * 4 * 60_000),
          note: this.defaultNoteForStatus(step),
        });
      }
    }
  }

  public get orderId(): string {
    return this._orderId;
  }

  public get status(): OrderStatus {
    return this._status;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get restaurantName(): string {
    return this._restaurantName;
  }

  public get bill(): BillBreakdown {
    return { ...this._bill };
  }

  public canAdvance(): boolean {
    if (this._status === 'CANCELLED' || this._status === 'DELIVERED') {
      return false;
    }
    return true;
  }

  public canCancel(): boolean {
    return this._status === 'PLACED' || this._status === 'CONFIRMED' || this._status === 'PREPARING';
  }

  /** Advances order along the standard lifecycle; throws OrderStateTransitionException at terminal states. */
  public advanceStatus(customNote?: string): OrderStatus {
    if (!this.canAdvance()) {
      throw new OrderStateTransitionException(this._orderId, this._status, 'advance');
    }
    const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(this._status);
    const nextStatus = ORDER_STATUS_SEQUENCE[currentIndex + 1];
    if (!nextStatus) {
      throw new OrderStateTransitionException(this._orderId, this._status, 'advance');
    }
    this._status = nextStatus;
    this._statusHistory.push({
      status: nextStatus,
      timestamp: new Date(),
      note: customNote?.trim() || this.defaultNoteForStatus(nextStatus),
    });
    return nextStatus;
  }

  /** Cancels an active pre-dispatch order; throws OrderStateTransitionException if already out/delivered/cancelled. */
  public cancelOrder(reason?: string): void {
    if (!this.canCancel()) {
      throw new OrderStateTransitionException(this._orderId, this._status, 'cancel');
    }
    this._status = 'CANCELLED';
    this._statusHistory.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      note: reason?.trim() || 'Cancelled by customer before dispatch',
    });
  }

  /** Generates a complete structured Order Summary snapshot. */
  public generateOrderSummary(): OrderSummary {
    return {
      orderId: this._orderId,
      createdAt: this._createdAt,
      status: this._status,
      statusLabel: ORDER_STATUS_LABELS[this._status],
      customerName: this._customer.name,
      customerPhone: this._customer.phone,
      customerEmail: this._customer.email,
      restaurantId: this._restaurantId,
      restaurantName: this._restaurantName,
      restaurantAddress: this._restaurantAddress,
      items: [...this._items],
      delivery: this._deliveryDetails,
      bill: { ...this._bill },
      statusHistory: [...this._statusHistory],
      pointsEarned: this._pointsEarned,
    };
  }

  private defaultNoteForStatus(status: OrderStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Restaurant accepted your order';
      case 'PREPARING':
        return 'Chef is preparing and packing your items';
      case 'OUT_FOR_DELIVERY':
        return `${this._deliveryDetails.assignedPartner.name} picked up your order (${this._deliveryDetails.assignedPartner.vehicleType})`;
      case 'DELIVERED':
        return `Delivered to ${this._deliveryDetails.address}`;
      case 'CANCELLED':
        return 'Order cancelled';
      default:
        return 'Order placed';
    }
  }
}

