import { AuthUserProfile } from './AuthService';
import { DELIVERY_STRATEGIES, DeliveryModeId, DeliveryStrategy } from './DeliveryStrategy';
import {
  AuthenticationException,
  DeliverySystemException,
  EmptyCartException,
  EntityNotFoundException,
  MixedRestaurantOrderException,
  ValidationException,
} from './Exceptions';
import {
  BeverageItem,
  ComboMeal,
  DishItem,
  IllustrationKind,
  ItemCustomization,
  MenuItem,
  MenuItemType,
  SpiceLevel,
} from './MenuItem';
import {
  BillBreakdown,
  DeliveryDetails,
  Order,
  OrderItem,
  OrderStatus,
  OrderSummary,
} from './Order';
import { Customer, DeliveryPartner } from './Person';
import { Restaurant } from './Restaurant';
import {
  createDeliveryPartners,
  createInitialCustomer,
  createSeedRestaurants,
} from './seedData';

export interface CartEntry {
  key: string;
  item: MenuItem;
  quantity: number;
  customization?: ItemCustomization;
}

export interface ExceptionLogEntry {
  id: string;
  code: string;
  name: string;
  message: string;
  timestamp: Date;
}

export interface PromoOffer {
  code: string;
  description: string;
  calculateDiscount: (itemsSubtotal: number) => number;
}

const PROMO_CATALOG: Map<string, PromoOffer> = new Map([
  [
    'GROUP13',
    {
      code: 'GROUP13',
      description: '15% off up to ₹120 (Group 13 Special)',
      calculateDiscount: (subtotal) => Math.min(120, Math.round(subtotal * 0.15)),
    },
  ],
  [
    'WELCOME50',
    {
      code: 'WELCOME50',
      description: 'Flat ₹50 off on orders ₹249+',
      calculateDiscount: (subtotal) => (subtotal >= 249 ? 50 : 0),
    },
  ],
]);

function buildCustomizationKey(customization?: ItemCustomization): string {
  if (!customization) {
    return 'default';
  }
  return JSON.stringify({
    extraCheese: Boolean(customization.extraCheese),
    spiceOverride: customization.spiceOverride ?? null,
    beverageSize: customization.beverageSize ?? 'Regular',
    iced: customization.iced ?? true,
    upsizeCombo: Boolean(customization.upsizeCombo),
    notes: customization.notes?.trim() ?? '',
  });
}

/**
 * Central coordinator class managing Restaurants (Map), Cart Entries (Map),
 * Favorites (Set), Orders (Map), Customer & DeliveryPartner instances,
 * bill calculation, and logged domain exceptions.
 */
export class FoodDeliverySystem {
  private readonly restaurants: Map<string, Restaurant>;
  private readonly orders: Map<string, Order>;
  private readonly cartEntries: Map<string, CartEntry>;
  private readonly favoriteRestaurantIds: Set<string>;
  private readonly deliveryPartners: DeliveryPartner[];
  private readonly exceptionLog: ExceptionLogEntry[];
  private readonly _customer: Customer;
  private _authenticatedUserId: string | null;
  private _cartRestaurantId: string | null;
  private _orderCounter: number;

  constructor(options?: { seedSampleOrder?: boolean }) {
    this.restaurants = new Map<string, Restaurant>();
    this.orders = new Map<string, Order>();
    this.cartEntries = new Map<string, CartEntry>();
    this.favoriteRestaurantIds = new Set<string>(['rest-zaffran', 'rest-koji']);
    this.deliveryPartners = createDeliveryPartners();
    this.exceptionLog = [];
    this._customer = createInitialCustomer();
    this._authenticatedUserId = null;
    this._cartRestaurantId = null;
    this._orderCounter = 1041;

    for (const restaurant of createSeedRestaurants()) {
      this.restaurants.set(restaurant.id, restaurant);
    }

    if (options?.seedSampleOrder !== false) {
      this.seedInitialSampleOrder();
    }
  }

  private seedInitialSampleOrder(): void {
    const zaffran = this.restaurants.get('rest-zaffran');
    if (!zaffran) {
      return;
    }
    const biryani = zaffran.menu.getItem('zf-biryani');
    const lassi = zaffran.menu.getItem('zf-lassi');
    const orderItems = [
      new OrderItem(biryani, 1, { spiceOverride: 'Medium', extraCheese: false }),
      new OrderItem(lassi, 2, { beverageSize: 'Large', iced: true }),
    ];
    const strategy = DELIVERY_STRATEGIES.standard;
    const bill = this.computeBillFromOrderItems(orderItems, zaffran.distanceKm, strategy, 'GROUP13');
    const deliveryDetails = new DeliveryDetails({
      recipientName: this._customer.name,
      phone: this._customer.phone,
      address: this._customer.address,
      landmark: this._customer.landmark,
      instructions: 'Ring doorbell once; leave at security desk if unreachable.',
      distanceKm: zaffran.distanceKm,
      strategy,
      assignedPartner: this.deliveryPartners[0],
      estimatedMinutes: strategy.estimateMinutes(20, zaffran.distanceKm),
    });

    const sampleOrder = new Order({
      orderId: 'ORD-1040',
      customer: this._customer,
      restaurantId: zaffran.id,
      restaurantName: zaffran.name,
      restaurantAddress: zaffran.address,
      items: orderItems,
      deliveryDetails,
      bill,
      pointsEarned: 24,
      initialStatus: 'PREPARING',
      createdAt: new Date(Date.now() - 18 * 60_000),
    });
    this.orders.set(sampleOrder.orderId, sampleOrder);
  }

  public get customer(): Customer {
    return this._customer;
  }

  public get cartRestaurantId(): string | null {
    return this._cartRestaurantId;
  }

  public getAllRestaurants(): Restaurant[] {
    return Array.from(this.restaurants.values());
  }

  public getAllCuisines(): string[] {
    const cuisineSet = new Set<string>();
    for (const restaurant of this.restaurants.values()) {
      for (const cuisine of restaurant.cuisines) {
        cuisineSet.add(cuisine);
      }
    }
    return Array.from(cuisineSet).sort();
  }

  public getRestaurant(restaurantId: string): Restaurant {
    const found = this.restaurants.get(restaurantId);
    if (!found) {
      throw new EntityNotFoundException('Restaurant', restaurantId);
    }
    return found;
  }

  public browseRestaurants(filters: {
    query?: string;
    cuisine?: string;
    vegOnly?: boolean;
    openOnly?: boolean;
    favoritesOnly?: boolean;
  }): Restaurant[] {
    const normalizedQuery = filters.query?.trim().toLowerCase() ?? '';
    return this.getAllRestaurants().filter((restaurant) => {
      if (filters.openOnly && !restaurant.isOpen) {
        return false;
      }
      if (filters.favoritesOnly && !this.favoriteRestaurantIds.has(restaurant.id)) {
        return false;
      }
      if (filters.cuisine && filters.cuisine !== 'All' && !restaurant.hasCuisine(filters.cuisine)) {
        return false;
      }
      if (filters.vegOnly) {
        const hasVegItem = restaurant.menu.getAllItems().some((item) => item.isVegetarian);
        if (!hasVegItem) {
          return false;
        }
      }
      if (!normalizedQuery) {
        return true;
      }
      const matchesRestaurant =
        restaurant.name.toLowerCase().includes(normalizedQuery) ||
        restaurant.tagline.toLowerCase().includes(normalizedQuery) ||
        restaurant.cuisines.some((c) => c.toLowerCase().includes(normalizedQuery));
      const matchesMenu = restaurant.menu.filterItems({ query: normalizedQuery }).length > 0;
      return matchesRestaurant || matchesMenu;
    });
  }

  public isFavoriteRestaurant(restaurantId: string): boolean {
    return this.favoriteRestaurantIds.has(restaurantId);
  }

  public toggleFavoriteRestaurant(restaurantId: string): boolean {
    this.getRestaurant(restaurantId);
    if (this.favoriteRestaurantIds.has(restaurantId)) {
      this.favoriteRestaurantIds.delete(restaurantId);
      return false;
    }
    this.favoriteRestaurantIds.add(restaurantId);
    return true;
  }

  public getCartEntries(): CartEntry[] {
    return Array.from(this.cartEntries.values());
  }

  public getCartItemCount(): number {
    let total = 0;
    for (const entry of this.cartEntries.values()) {
      total += entry.quantity;
    }
    return total;
  }

  public getCartRestaurant(): Restaurant | null {
    if (!this._cartRestaurantId) {
      return null;
    }
    return this.restaurants.get(this._cartRestaurantId) ?? null;
  }

  /**
   * Adds a food/beverage/combo item to the active cart after checking restaurant
   * open status, item availability, quantity limits, and single-restaurant cart rules.
   */
  public addToCart(
    restaurantId: string,
    itemId: string,
    quantity = 1,
    customization?: ItemCustomization,
    forceSwitchRestaurant = false,
  ): CartEntry {
    const restaurant = this.getRestaurant(restaurantId);
    restaurant.assertOpen();

    const item = restaurant.menu.getItem(itemId);
    item.assertOrderable(quantity);

    if (this._cartRestaurantId && this._cartRestaurantId !== restaurantId) {
      if (!forceSwitchRestaurant) {
        const currentRest = this.getRestaurant(this._cartRestaurantId);
        throw new MixedRestaurantOrderException(currentRest.name, restaurant.name);
      }
      this.clearCart();
    }

    this._cartRestaurantId = restaurantId;
    const key = `${itemId}::${buildCustomizationKey(customization)}`;
    const existing = this.cartEntries.get(key);
    const nextQty = (existing?.quantity ?? 0) + quantity;
    item.assertOrderable(nextQty);

    const entry: CartEntry = {
      key,
      item,
      quantity: nextQty,
      customization,
    };
    this.cartEntries.set(key, entry);
    return entry;
  }

  public updateCartQuantity(entryKey: string, delta: number): void {
    const entry = this.cartEntries.get(entryKey);
    if (!entry) {
      throw new EntityNotFoundException('CartItem', entryKey);
    }
    const nextQty = entry.quantity + delta;
    if (nextQty <= 0) {
      this.cartEntries.delete(entryKey);
      if (this.cartEntries.size === 0) {
        this._cartRestaurantId = null;
      }
      return;
    }
    entry.item.assertOrderable(nextQty);
    this.cartEntries.set(entryKey, { ...entry, quantity: nextQty });
  }

  public clearCart(): void {
    this.cartEntries.clear();
    this._cartRestaurantId = null;
  }

  public getAvailablePromos(): PromoOffer[] {
    return Array.from(PROMO_CATALOG.values());
  }

  public validatePromoCode(promoCode?: string): PromoOffer | undefined {
    const trimmed = promoCode?.trim().toUpperCase();
    if (!trimmed) {
      return undefined;
    }
    const offer = PROMO_CATALOG.get(trimmed);
    if (!offer) {
      throw new ValidationException(
        `Promo code "${trimmed}" is invalid. Try GROUP13 or WELCOME50.`,
        { promoCode: trimmed },
      );
    }
    return offer;
  }

  private prepareCartOrderSnapshot(deliveryMode: DeliveryModeId, promoCode?: string): {
    restaurant: Restaurant;
    strategy: DeliveryStrategy;
    orderItems: OrderItem[];
    bill: BillBreakdown;
    estimatedMinutes: number;
  } {
    if (this.cartEntries.size === 0 || !this._cartRestaurantId) {
      throw new EmptyCartException();
    }
    const restaurant = this.getRestaurant(this._cartRestaurantId);
    const strategy = DELIVERY_STRATEGIES[deliveryMode];
    const orderItems = this.getCartEntries().map(
      (entry) => new OrderItem(entry.item, entry.quantity, entry.customization),
    );
    const bill = this.computeBillFromOrderItems(
      orderItems,
      restaurant.distanceKm,
      strategy,
      promoCode,
    );
    const maxPrep = Math.max(...this.getCartEntries().map((e) => e.item.prepMinutes));
    const estimatedMinutes = strategy.estimateMinutes(maxPrep, restaurant.distanceKm);
    return { restaurant, strategy, orderItems, bill, estimatedMinutes };
  }

  /**
   * Computes a live itemized bill preview across polymorphic MenuItem and DeliveryStrategy objects.
   */
  public calculateBillPreview(
    deliveryMode: DeliveryModeId,
    promoCode?: string,
  ): { bill: BillBreakdown; estimatedMinutes: number; restaurant: Restaurant } {
    const { bill, estimatedMinutes, restaurant } = this.prepareCartOrderSnapshot(
      deliveryMode,
      promoCode,
    );
    return { bill, estimatedMinutes, restaurant };
  }

  private computeBillFromOrderItems(
    orderItems: OrderItem[],
    distanceKm: number,
    strategy: DeliveryStrategy,
    promoCode?: string,
  ): BillBreakdown {
    const itemsSubtotal = orderItems.reduce((sum, item) => sum + item.lineSubtotal, 0);
    const totalPackagingFee = orderItems.reduce((sum, item) => sum + item.linePackagingFee, 0);
    const rawTax = orderItems.reduce((sum, item) => sum + item.lineTax, 0);

    const promo = this.validatePromoCode(promoCode);
    const discountAmount = promo ? promo.calculateDiscount(itemsSubtotal) : 0;
    if (promo?.code === 'WELCOME50' && itemsSubtotal < 249) {
      throw new ValidationException(
        'Promo code WELCOME50 requires a minimum items subtotal of ₹249.',
        { itemsSubtotal, minRequired: 249 },
      );
    }

    const deliveryFee = strategy.calculateFee(distanceKm, itemsSubtotal);
    const taxableBase = Math.max(0, itemsSubtotal - discountAmount);
    const taxAmount = discountAmount > 0 ? Math.round(taxableBase * 0.05) : rawTax;
    const grandTotal = Math.max(0, taxableBase + totalPackagingFee + deliveryFee + taxAmount);

    return {
      itemsSubtotal,
      totalPackagingFee,
      deliveryFee,
      discountAmount,
      taxAmount,
      grandTotal,
      appliedPromoCode: promo?.code,
    };
  }

  /**
   * Validates cart, customer & delivery details, creates an Order snapshot,
   * stores it in the orders Map, awards loyalty points, and clears the cart.
   */
  public placeOrder(input: {
    recipientName: string;
    phone: string;
    email: string;
    address: string;
    landmark?: string;
    instructions?: string;
    deliveryMode: DeliveryModeId;
    promoCode?: string;
  }): OrderSummary {
    const { restaurant, strategy, orderItems, bill, estimatedMinutes } =
      this.prepareCartOrderSnapshot(input.deliveryMode, input.promoCode);
    restaurant.assertOpen();

    // Update customer profile via encapsulated validation before finalizing order
    this._customer.updateDetails({
      name: input.recipientName,
      phone: input.phone,
      email: input.email,
      address: input.address,
      landmark: input.landmark,
    });

    const partnerIndex = this.orders.size % this.deliveryPartners.length;
    const assignedPartner =
      input.deliveryMode === 'eco'
        ? this.deliveryPartners[2]
        : this.deliveryPartners[partnerIndex];

    const deliveryDetails = new DeliveryDetails({
      recipientName: input.recipientName,
      phone: input.phone,
      address: input.address,
      landmark: input.landmark,
      instructions: input.instructions,
      distanceKm: restaurant.distanceKm,
      strategy,
      assignedPartner,
      estimatedMinutes,
    });

    const orderId = `ORD-${this._orderCounter}`;
    this._orderCounter += 1;
    const pointsEarned = this._customer.earnPoints(bill.grandTotal);

    const order = new Order({
      orderId,
      customer: this._customer,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantAddress: restaurant.address,
      items: orderItems,
      deliveryDetails,
      bill,
      pointsEarned,
      initialStatus: 'PLACED',
    });

    this.orders.set(order.orderId, order);
    this.clearCart();
    return order.generateOrderSummary();
  }

  public getAllOrderSummaries(): OrderSummary[] {
    return Array.from(this.orders.values())
      .map((order) => order.generateOrderSummary())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public getOrder(orderId: string): Order {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new EntityNotFoundException('Order', orderId);
    }
    return order;
  }

  public advanceOrderStatus(orderId: string): OrderStatus {
    return this.getOrder(orderId).advanceStatus();
  }

  public cancelOrder(orderId: string, reason?: string): void {
    this.getOrder(orderId).cancelOrder(reason);
  }

  public toggleRestaurantOpen(restaurantId: string): boolean {
    const rest = this.getRestaurant(restaurantId);
    return rest.toggleOpenStatus();
  }

  public toggleMenuItemAvailability(restaurantId: string, itemId: string): boolean {
    const item = this.getRestaurant(restaurantId).menu.getItem(itemId);
    const next = !item.isAvailable;
    item.setAvailability(next);
    return next;
  }

  public updateMenuItemPrice(restaurantId: string, itemId: string, newPrice: number): void {
    const item = this.getRestaurant(restaurantId).menu.getItem(itemId);
    item.updatePrice(newPrice);
  }

  public addNewMenuItem(input: {
    restaurantId: string;
    itemType: MenuItemType;
    name: string;
    description: string;
    basePrice: number;
    category: string;
    isVegetarian: boolean;
    prepMinutes: number;
    spiceLevel?: SpiceLevel;
    portionSize?: string;
    volumeMl?: number;
    includedItems?: string[];
    discountPercent?: number;
  }): MenuItem {
    const restaurant = this.getRestaurant(input.restaurantId);
    if (input.name.trim().length < 2) {
      throw new ValidationException('Item name must be at least 2 characters.');
    }
    if (input.description.trim().length < 5) {
      throw new ValidationException('Item description must be at least 5 characters.');
    }
    if (!Number.isFinite(input.prepMinutes) || input.prepMinutes < 1) {
      throw new ValidationException('Preparation minutes must be at least 1.');
    }

    const id = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const illustrationByType: Record<MenuItemType, IllustrationKind> = {
      Dish: 'curry',
      Beverage: 'beverage',
      Combo: 'combo',
    };

    let newItem: MenuItem;
    if (input.itemType === 'Dish') {
      newItem = new DishItem({
        id,
        name: input.name,
        description: input.description,
        basePrice: input.basePrice,
        isVegetarian: input.isVegetarian,
        prepMinutes: input.prepMinutes,
        category: input.category || 'Specials',
        illustration: illustrationByType.Dish,
        tags: ['New Addition'],
        spiceLevel: input.spiceLevel ?? 'Medium',
        portionSize: input.portionSize?.trim() || 'Regular Portion',
      });
    } else if (input.itemType === 'Beverage') {
      newItem = new BeverageItem({
        id,
        name: input.name,
        description: input.description,
        basePrice: input.basePrice,
        isVegetarian: input.isVegetarian,
        prepMinutes: input.prepMinutes,
        category: input.category || 'Beverages',
        illustration: illustrationByType.Beverage,
        tags: ['Fresh Pour'],
        volumeMl: input.volumeMl && input.volumeMl > 0 ? input.volumeMl : 300,
        supportsIced: true,
      });
    } else {
      const itemsList =
        input.includedItems && input.includedItems.length > 0
          ? input.includedItems
          : ['Main Dish', 'Side', 'Beverage'];
      newItem = new ComboMeal({
        id,
        name: input.name,
        description: input.description,
        basePrice: input.basePrice,
        isVegetarian: input.isVegetarian,
        prepMinutes: input.prepMinutes,
        category: input.category || 'Combos',
        illustration: illustrationByType.Combo,
        tags: ['Custom Combo'],
        includedItems: itemsList,
        discountPercent: input.discountPercent ?? 12,
      });
    }

    restaurant.menu.addItem(newItem);
    return newItem;
  }

  public recordException(error: unknown): string {
    if (error instanceof DeliverySystemException) {
      this.exceptionLog.unshift({
        id: `EX-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code: error.code,
        name: error.name,
        message: error.message,
        timestamp: error.timestamp,
      });
      if (this.exceptionLog.length > 25) {
        this.exceptionLog.pop();
      }
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected system error occurred.';
  }

  public getExceptionLog(): ExceptionLogEntry[] {
    return [...this.exceptionLog];
  }

  public get authenticatedUserId(): string | null {
    return this._authenticatedUserId;
  }

  public syncAuthenticatedCustomer(profile: AuthUserProfile | null): void {
    if (!profile) {
      this._authenticatedUserId = null;
      return;
    }
    this._authenticatedUserId = profile.id;
    try {
      this._customer.updateDetails({
        name: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        address: profile.address,
        landmark: profile.landmark,
      });
    } catch {
      // Keep existing valid fallback fields if partial metadata was supplied
      if (profile.email) {
        this._customer.email = profile.email;
      }
    }
  }

  public assertAuthenticatedForCheckout(isSupabaseActive: boolean): void {
    if (isSupabaseActive && !this._authenticatedUserId) {
      throw new AuthenticationException(
        'Please sign in with your Supabase account before placing an order.',
      );
    }
  }

  public getCollectionTelemetry() {
    let totalMenuItems = 0;
    for (const r of this.restaurants.values()) {
      totalMenuItems += r.menu.size;
    }
    return {
      restaurantsMapSize: this.restaurants.size,
      totalMenuItemsInMenus: totalMenuItems,
      ordersMapSize: this.orders.size,
      cartMapSize: this.cartEntries.size,
      favoritesSetSize: this.favoriteRestaurantIds.size,
      cuisinesSetSize: this.getAllCuisines().length,
      deliveryPartnersCount: this.deliveryPartners.length,
      caughtExceptionsCount: this.exceptionLog.length,
      isAuthenticated: Boolean(this._authenticatedUserId),
    };
  }
}

