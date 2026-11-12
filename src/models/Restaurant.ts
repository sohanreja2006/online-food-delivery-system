import { EntityNotFoundException, RestaurantClosedException } from './Exceptions';
import { MenuItem } from './MenuItem';

/**
 * Encapsulates a restaurant's menu using a Map collection keyed by item ID
 * and provides category/dietary filtering operations.
 */
export class Menu {
  private readonly items: Map<string, MenuItem>;

  constructor(initialItems: MenuItem[] = []) {
    this.items = new Map<string, MenuItem>();
    for (const item of initialItems) {
      this.addItem(item);
    }
  }

  public addItem(item: MenuItem): void {
    this.items.set(item.id, item);
  }

  public removeItem(itemId: string): boolean {
    return this.items.delete(itemId);
  }

  public getItem(itemId: string): MenuItem {
    const found = this.items.get(itemId);
    if (!found) {
      throw new EntityNotFoundException('MenuItem', itemId);
    }
    return found;
  }

  public getAllItems(): MenuItem[] {
    return Array.from(this.items.values());
  }

  public get size(): number {
    return this.items.size;
  }

  public getCategories(): Set<string> {
    const categories = new Set<string>();
    for (const item of this.items.values()) {
      categories.add(item.category);
    }
    return categories;
  }

  public filterItems(options: {
    query?: string;
    category?: string;
    vegOnly?: boolean;
  }): MenuItem[] {
    const normalizedQuery = options.query?.trim().toLowerCase() ?? '';
    return this.getAllItems().filter((item) => {
      if (options.vegOnly && !item.isVegetarian) {
        return false;
      }
      if (options.category && options.category !== 'All' && item.category !== options.category) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      );
    });
  }
}

export interface RestaurantParams {
  id: string;
  name: string;
  tagline: string;
  cuisines: string[];
  rating: number;
  reviewCount: number;
  distanceKm: number;
  address: string;
  costForTwo: number;
  accentColor: string;
  isOpen?: boolean;
  menuItems?: MenuItem[];
}

/**
 * Restaurant aggregate managing kitchen metadata, cuisine Set collection,
 * open/closed availability, and its Menu instance.
 */
export class Restaurant {
  private readonly _id: string;
  private _name: string;
  private _tagline: string;
  private readonly _cuisines: Set<string>;
  private _rating: number;
  private _reviewCount: number;
  private _distanceKm: number;
  private _address: string;
  private _costForTwo: number;
  private _accentColor: string;
  private _isOpen: boolean;
  private readonly _menu: Menu;

  constructor(params: RestaurantParams) {
    this._id = params.id;
    this._name = params.name.trim();
    this._tagline = params.tagline.trim();
    this._cuisines = new Set(params.cuisines.map((c) => c.trim()));
    this._rating = params.rating;
    this._reviewCount = params.reviewCount;
    this._distanceKm = params.distanceKm;
    this._address = params.address.trim();
    this._costForTwo = params.costForTwo;
    this._accentColor = params.accentColor;
    this._isOpen = params.isOpen ?? true;
    this._menu = new Menu(params.menuItems ?? []);
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get tagline(): string {
    return this._tagline;
  }

  public get cuisines(): string[] {
    return Array.from(this._cuisines);
  }

  public get rating(): number {
    return this._rating;
  }

  public get reviewCount(): number {
    return this._reviewCount;
  }

  public get distanceKm(): number {
    return this._distanceKm;
  }

  public get address(): string {
    return this._address;
  }

  public get costForTwo(): number {
    return this._costForTwo;
  }

  public get accentColor(): string {
    return this._accentColor;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public get menu(): Menu {
    return this._menu;
  }

  public hasCuisine(cuisine: string): boolean {
    return this._cuisines.has(cuisine);
  }

  public setOpenStatus(open: boolean): void {
    this._isOpen = open;
  }

  public toggleOpenStatus(): boolean {
    this._isOpen = !this._isOpen;
    return this._isOpen;
  }

  public assertOpen(): void {
    if (!this._isOpen) {
      throw new RestaurantClosedException(this._name);
    }
  }

  public getEstimatedPrepMinutes(): number {
    const items = this._menu.getAllItems();
    if (items.length === 0) {
      return 20;
    }
    const avgPrep = items.reduce((sum, item) => sum + item.prepMinutes, 0) / items.length;
    return Math.round(avgPrep);
  }
}

