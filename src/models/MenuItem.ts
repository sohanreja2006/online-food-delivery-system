import { InvalidQuantityException, ItemUnavailableException, ValidationException } from './Exceptions';

export type SpiceLevel = 'Mild' | 'Medium' | 'Hot';
export type BeverageSize = 'Regular' | 'Large';
export type MenuItemType = 'Dish' | 'Beverage' | 'Combo';
export type IllustrationKind =
  | 'biryani'
  | 'curry'
  | 'pizza'
  | 'pasta'
  | 'burger'
  | 'fries'
  | 'ramen'
  | 'dumpling'
  | 'dessert'
  | 'beverage'
  | 'coffee'
  | 'combo';

export interface ItemCustomization {
  extraCheese?: boolean;
  spiceOverride?: SpiceLevel;
  beverageSize?: BeverageSize;
  iced?: boolean;
  upsizeCombo?: boolean;
  notes?: string;
}

export interface MenuItemBaseParams {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  isVegetarian: boolean;
  prepMinutes: number;
  category: string;
  illustration: IllustrationKind;
  tags?: string[];
  isAvailable?: boolean;
}

/**
 * Abstract base class representing any orderable menu item.
 * Subclasses (DishItem, BeverageItem, ComboMeal) inherit shared fields and
 * polymorphically override pricing, packaging fee, tax rate, and customization behavior.
 */
export abstract class MenuItem {
  private readonly _id: string;
  private _name: string;
  private _description: string;
  private _basePrice: number;
  private _isVegetarian: boolean;
  private _isAvailable: boolean;
  private _prepMinutes: number;
  private _category: string;
  private _illustration: IllustrationKind;
  private readonly _tags: Set<string>;

  constructor(params: MenuItemBaseParams) {
    this._id = params.id;
    this._name = params.name.trim();
    this._description = params.description.trim();
    this._basePrice = 0;
    this._isVegetarian = params.isVegetarian;
    this._isAvailable = params.isAvailable ?? true;
    this._prepMinutes = params.prepMinutes;
    this._category = params.category.trim();
    this._illustration = params.illustration;
    this._tags = new Set((params.tags ?? []).map((t) => t.trim()));
    this.updatePrice(params.basePrice);
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string {
    return this._description;
  }

  public get basePrice(): number {
    return this._basePrice;
  }

  public get isVegetarian(): boolean {
    return this._isVegetarian;
  }

  public get isAvailable(): boolean {
    return this._isAvailable;
  }

  public get prepMinutes(): number {
    return this._prepMinutes;
  }

  public get category(): string {
    return this._category;
  }

  public get illustration(): IllustrationKind {
    return this._illustration;
  }

  public get tags(): string[] {
    return Array.from(this._tags);
  }

  public setAvailability(available: boolean): void {
    this._isAvailable = available;
  }

  public updatePrice(newPrice: number): void {
    if (!Number.isFinite(newPrice) || newPrice <= 0) {
      throw new ValidationException(`Price for "${this._name}" must be greater than ₹0.`, {
        price: newPrice,
      });
    }
    this._basePrice = Math.round(newPrice);
  }

  /** Ensures the item is available and quantity is within valid order limits. */
  public assertOrderable(quantity: number): void {
    if (!this._isAvailable) {
      throw new ItemUnavailableException(this._name);
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new InvalidQuantityException(quantity, 20);
    }
  }

  /** Calculates total line subtotal (unit price * quantity) after validation. */
  public calculateLineSubtotal(quantity: number, customization?: ItemCustomization): number {
    this.assertOrderable(quantity);
    return this.calculateUnitPrice(customization) * quantity;
  }

  public abstract getItemType(): MenuItemType;
  public abstract calculateUnitPrice(customization?: ItemCustomization): number;
  public abstract getPackagingFee(): number;
  public abstract getTaxRate(): number;
  public abstract getCustomizationSummary(customization?: ItemCustomization): string;
  public abstract getDetailsBadge(): string;
}

/**
 * Standard cooked food dish (entrees, pizzas, burgers, bowls, desserts).
 */
export class DishItem extends MenuItem {
  private readonly _spiceLevel: SpiceLevel;
  private readonly _portionSize: string;

  constructor(
    params: MenuItemBaseParams & {
      spiceLevel: SpiceLevel;
      portionSize: string;
    },
  ) {
    super(params);
    this._spiceLevel = params.spiceLevel;
    this._portionSize = params.portionSize;
  }

  public get spiceLevel(): SpiceLevel {
    return this._spiceLevel;
  }

  public get portionSize(): string {
    return this._portionSize;
  }

  public override getItemType(): MenuItemType {
    return 'Dish';
  }

  public override calculateUnitPrice(customization?: ItemCustomization): number {
    const addOn = customization?.extraCheese ? 45 : 0;
    return this.basePrice + addOn;
  }

  public override getPackagingFee(): number {
    return 15;
  }

  public override getTaxRate(): number {
    return 0.05;
  }

  public override getCustomizationSummary(customization?: ItemCustomization): string {
    const parts: string[] = [];
    parts.push(`Spice: ${customization?.spiceOverride ?? this._spiceLevel}`);
    if (customization?.extraCheese) {
      parts.push('Extra Cheese / Topping (+₹45)');
    }
    if (customization?.notes?.trim()) {
      parts.push(`Note: ${customization.notes.trim()}`);
    }
    return parts.join(' • ');
  }

  public override getDetailsBadge(): string {
    return `${this._portionSize} • ${this._spiceLevel}`;
  }
}

/**
 * Beverage item supporting size scaling (Regular / Large) and chilled / hot preparation.
 */
export class BeverageItem extends MenuItem {
  private readonly _volumeMl: number;
  private readonly _supportsIced: boolean;

  constructor(
    params: MenuItemBaseParams & {
      volumeMl: number;
      supportsIced?: boolean;
    },
  ) {
    super(params);
    this._volumeMl = params.volumeMl;
    this._supportsIced = params.supportsIced ?? true;
  }

  public get volumeMl(): number {
    return this._volumeMl;
  }

  public get supportsIced(): boolean {
    return this._supportsIced;
  }

  public override getItemType(): MenuItemType {
    return 'Beverage';
  }

  public override calculateUnitPrice(customization?: ItemCustomization): number {
    const multiplier = customization?.beverageSize === 'Large' ? 1.35 : 1;
    return Math.round(this.basePrice * multiplier);
  }

  public override getPackagingFee(): number {
    return 10;
  }

  public override getTaxRate(): number {
    return 0.05;
  }

  public override getCustomizationSummary(customization?: ItemCustomization): string {
    const size = customization?.beverageSize ?? 'Regular';
    const scaledMl = size === 'Large' ? Math.round(this._volumeMl * 1.4) : this._volumeMl;
    const temp = this._supportsIced
      ? customization?.iced === false
        ? 'Served Warm'
        : 'Chilled / Iced'
      : 'Served Hot';
    return `${size} (${scaledMl}ml) • ${temp}`;
  }

  public override getDetailsBadge(): string {
    return `${this._volumeMl}ml • Spill-proof Cup`;
  }
}

/**
 * Bundled combo meal applying a built-in combo discount and optional upsize.
 */
export class ComboMeal extends MenuItem {
  private readonly _includedItems: readonly string[];
  private readonly _discountPercent: number;

  constructor(
    params: MenuItemBaseParams & {
      includedItems: string[];
      discountPercent: number;
    },
  ) {
    super(params);
    this._includedItems = [...params.includedItems];
    this._discountPercent = params.discountPercent;
  }

  public get includedItems(): readonly string[] {
    return this._includedItems;
  }

  public get discountPercent(): number {
    return this._discountPercent;
  }

  public override getItemType(): MenuItemType {
    return 'Combo';
  }

  public override calculateUnitPrice(customization?: ItemCustomization): number {
    const discountedBase = Math.round(this.basePrice * (1 - this._discountPercent / 100));
    const upsizeCost = customization?.upsizeCombo ? 60 : 0;
    return discountedBase + upsizeCost;
  }

  public override getPackagingFee(): number {
    return 25;
  }

  public override getTaxRate(): number {
    return 0.05;
  }

  public override getCustomizationSummary(customization?: ItemCustomization): string {
    const base = `Includes ${this._includedItems.join(' + ')} (${this._discountPercent}% combo savings)`;
    return customization?.upsizeCombo ? `${base} • Upsized (+₹60)` : base;
  }

  public override getDetailsBadge(): string {
    return `${this._includedItems.length}-Item Bundle • Save ${this._discountPercent}%`;
  }
}

