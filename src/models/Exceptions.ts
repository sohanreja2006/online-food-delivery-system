/**
 * Base exception class for all domain errors in the Online Food Delivery System.
 * Demonstrates inheritance from built-in Error and standardized exception metadata.
 */
export abstract class DeliverySystemException extends Error {
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.timestamp = new Date();
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised when user input, profile fields, addresses, or promo codes fail validation. */
export class ValidationException extends DeliverySystemException {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, details);
  }
}

/** Raised when an item quantity is zero, negative, non-integer, or exceeds order limits. */
export class InvalidQuantityException extends DeliverySystemException {
  constructor(quantity: number, maxAllowed = 20) {
    super(
      'INVALID_QUANTITY',
      `Invalid quantity (${quantity}). Quantity must be a whole number between 1 and ${maxAllowed}.`,
      { quantity, maxAllowed },
    );
  }
}

/** Raised when attempting to order a menu item marked as unavailable / sold out. */
export class ItemUnavailableException extends DeliverySystemException {
  constructor(itemName: string) {
    super(
      'ITEM_UNAVAILABLE',
      `"${itemName}" is currently sold out and cannot be added to your cart.`,
      { itemName },
    );
  }
}

/** Raised when attempting to add items or place an order from a closed restaurant. */
export class RestaurantClosedException extends DeliverySystemException {
  constructor(restaurantName: string) {
    super(
      'RESTAURANT_CLOSED',
      `${restaurantName} is currently closed and not accepting orders right now.`,
      { restaurantName },
    );
  }
}

/** Raised when adding items from a different restaurant while another restaurant's cart is active. */
export class MixedRestaurantOrderException extends DeliverySystemException {
  public readonly currentRestaurantName: string;
  public readonly attemptedRestaurantName: string;

  constructor(currentRestaurantName: string, attemptedRestaurantName: string) {
    super(
      'MIXED_RESTAURANT_CART',
      `Your cart already contains items from ${currentRestaurantName}. Clear your cart before ordering from ${attemptedRestaurantName}.`,
      { currentRestaurantName, attemptedRestaurantName },
    );
    this.currentRestaurantName = currentRestaurantName;
    this.attemptedRestaurantName = attemptedRestaurantName;
  }
}

/** Raised when attempting checkout or bill finalization with an empty cart. */
export class EmptyCartException extends DeliverySystemException {
  constructor() {
    super('EMPTY_CART', 'Your cart is empty. Select at least one food item before placing an order.');
  }
}

/** Raised when an order cannot transition to the requested lifecycle state. */
export class OrderStateTransitionException extends DeliverySystemException {
  constructor(orderId: string, currentStatus: string, attemptedAction: string) {
    super(
      'INVALID_ORDER_TRANSITION',
      `Cannot ${attemptedAction} order ${orderId} because its current status is "${currentStatus}".`,
      { orderId, currentStatus, attemptedAction },
    );
  }
}

/** Raised when a requested restaurant, menu item, or order ID cannot be found in collections. */
export class EntityNotFoundException extends DeliverySystemException {
  constructor(entityType: string, entityId: string) {
    super(
      'ENTITY_NOT_FOUND',
      `${entityType} with ID "${entityId}" was not found.`,
      { entityType, entityId },
    );
  }
}

/** Raised when Supabase authentication fails or an unauthenticated user attempts a protected action. */
export class AuthenticationException extends DeliverySystemException {
  constructor(message: string, details?: Record<string, unknown>) {
    super('AUTHENTICATION_ERROR', message, details);
  }
}

