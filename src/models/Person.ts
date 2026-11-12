import { ValidationException } from './Exceptions';

/**
 * Abstract base class representing a person in the delivery ecosystem.
 * Demonstrates encapsulation (private fields + validated setters) and polymorphism.
 */
export abstract class Person {
  private readonly _id: string;
  private _name: string;
  private _phone: string;

  constructor(id: string, name: string, phone: string) {
    this._id = id;
    this._name = '';
    this._phone = '';
    this.name = name;
    this.phone = phone;
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public set name(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      throw new ValidationException('Name must be at least 2 characters long.', { field: 'name' });
    }
    this._name = trimmed;
  }

  public get phone(): string {
    return this._phone;
  }

  public set phone(value: string) {
    const digits = value.replace(/[\s\-+]/g, '');
    if (!/^\d{10,13}$/.test(digits)) {
      throw new ValidationException('Phone number must contain 10 to 13 digits.', {
        field: 'phone',
        value,
      });
    }
    this._phone = value.trim();
  }

  /** Polymorphic role label overridden by each Person subclass. */
  public abstract getRoleLabel(): string;

  /** Polymorphic concise summary of the person's identity and role metadata. */
  public abstract getProfileSummary(): string;
}

/**
 * Customer entity managing personal contact info, default delivery address, and loyalty points.
 */
export class Customer extends Person {
  private _email: string;
  private _address: string;
  private _landmark: string;
  private _loyaltyPoints: number;

  constructor(
    id: string,
    name: string,
    phone: string,
    email: string,
    address: string,
    landmark = '',
    loyaltyPoints = 120,
  ) {
    super(id, name, phone);
    this._email = '';
    this._address = '';
    this._landmark = landmark.trim();
    this._loyaltyPoints = loyaltyPoints;
    this.email = email;
    this.address = address;
  }

  public get email(): string {
    return this._email;
  }

  public set email(value: string) {
    const trimmed = value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new ValidationException('Please provide a valid email address.', {
        field: 'email',
        value,
      });
    }
    this._email = trimmed;
  }

  public get address(): string {
    return this._address;
  }

  public set address(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 8) {
      throw new ValidationException('Delivery address must be at least 8 characters long.', {
        field: 'address',
      });
    }
    this._address = trimmed;
  }

  public get landmark(): string {
    return this._landmark;
  }

  public set landmark(value: string) {
    this._landmark = value.trim();
  }

  public get loyaltyPoints(): number {
    return this._loyaltyPoints;
  }

  /** Awards loyalty points proportional to the finalized bill total. */
  public earnPoints(billTotal: number): number {
    const earned = Math.max(5, Math.floor(billTotal / 25));
    this._loyaltyPoints += earned;
    return earned;
  }

  /** Updates encapsulated customer details atomically after validating every field. */
  public updateDetails(input: {
    name: string;
    phone: string;
    email: string;
    address: string;
    landmark?: string;
  }): void {
    // Validate via a temporary Customer check before mutating so partial invalid input never corrupts state.
    const probe = new Customer(
      this.id,
      input.name,
      input.phone,
      input.email,
      input.address,
      input.landmark ?? '',
      this._loyaltyPoints,
    );
    this._nameSafeUpdate(probe);
  }

  private _nameSafeUpdate(validated: Customer): void {
    this.name = validated.name;
    this.phone = validated.phone;
    this.email = validated.email;
    this.address = validated.address;
    this.landmark = validated.landmark;
  }

  public override getRoleLabel(): string {
    return 'Customer';
  }

  public override getProfileSummary(): string {
    return `${this.name} • ${this.phone} • ${this._loyaltyPoints} pts`;
  }
}

export type VehicleType = 'Motorbike' | 'Scooter' | 'EV Cycle';

/**
 * Delivery partner entity assigned to fulfill and deliver customer orders.
 */
export class DeliveryPartner extends Person {
  private _vehicleType: VehicleType;
  private _vehicleNumber: string;
  private _rating: number;

  constructor(
    id: string,
    name: string,
    phone: string,
    vehicleType: VehicleType,
    vehicleNumber: string,
    rating = 4.8,
  ) {
    super(id, name, phone);
    this._vehicleType = vehicleType;
    this._vehicleNumber = vehicleNumber.trim();
    this._rating = rating;
  }

  public get vehicleType(): VehicleType {
    return this._vehicleType;
  }

  public get vehicleNumber(): string {
    return this._vehicleNumber;
  }

  public get rating(): number {
    return this._rating;
  }

  public override getRoleLabel(): string {
    return 'Delivery Partner';
  }

  public override getProfileSummary(): string {
    return `${this.name} (${this._vehicleType} • ${this._vehicleNumber} • ★ ${this._rating.toFixed(1)})`;
  }
}

