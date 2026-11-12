import { SupabaseClient, User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { mapSupabaseUserToProfile, SupabaseAuthService } from '../AuthService';
import {
  EcoCycleDelivery,
  ExpressDelivery,
  StandardDelivery,
} from '../DeliveryStrategy';
import {
  AuthenticationException,
  EmptyCartException,
  EntityNotFoundException,
  InvalidQuantityException,
  ItemUnavailableException,
  MixedRestaurantOrderException,
  OrderStateTransitionException,
  RestaurantClosedException,
  ValidationException,
} from '../Exceptions';
import { FoodDeliverySystem } from '../FoodDeliverySystem';
import { BeverageItem, ComboMeal, DishItem, MenuItem } from '../MenuItem';
import { Customer, DeliveryPartner, Person } from '../Person';

describe('Online Food Delivery System — OOP Domain & Workflows', () => {
  it('demonstrates encapsulation & inheritance for Person subclasses', () => {
    const customer = new Customer(
      'C-1',
      'Adnan Sadique',
      '+91 9876543210',
      'adnan@example.com',
      '12 Park Avenue, Block A',
    );
    const partner = new DeliveryPartner(
      'D-1',
      'Rohan Verma',
      '9830112233',
      'Motorbike',
      'WB-06-4481',
    );

    const people: Person[] = [customer, partner];
    expect(people.map((p) => p.getRoleLabel())).toEqual(['Customer', 'Delivery Partner']);
    expect(() => {
      customer.phone = '123';
    }).toThrow(ValidationException);
    expect(() => {
      customer.email = 'invalid-email';
    }).toThrow(ValidationException);
  });

  it('demonstrates polymorphism across MenuItem subclasses', () => {
    const dish = new DishItem({
      id: 'd1',
      name: 'Paneer Tikka',
      description: 'Charcoal roasted cottage cheese',
      basePrice: 250,
      isVegetarian: true,
      prepMinutes: 15,
      category: 'Starters',
      illustration: 'curry',
      spiceLevel: 'Medium',
      portionSize: '8 Pieces',
    });

    const bev = new BeverageItem({
      id: 'b1',
      name: 'Mango Lassi',
      description: 'Thick sweet mango yogurt drink',
      basePrice: 100,
      isVegetarian: true,
      prepMinutes: 5,
      category: 'Beverages',
      illustration: 'beverage',
      volumeMl: 300,
    });

    const combo = new ComboMeal({
      id: 'c1',
      name: 'Lunch Box',
      description: 'Complete lunch meal',
      basePrice: 400,
      isVegetarian: true,
      prepMinutes: 20,
      category: 'Combos',
      illustration: 'combo',
      includedItems: ['Main', 'Bread', 'Drink'],
      discountPercent: 15,
    });

    const menuItems: MenuItem[] = [dish, bev, combo];
    expect(menuItems.map((m) => m.getPackagingFee())).toEqual([15, 10, 25]);
    expect(dish.calculateUnitPrice({ extraCheese: true })).toBe(295);
    expect(bev.calculateUnitPrice({ beverageSize: 'Large' })).toBe(135);
    expect(combo.calculateUnitPrice({ upsizeCombo: true })).toBe(400); // 400*0.85 + 60 = 340 + 60
  });

  it('demonstrates DeliveryStrategy polymorphism and distance validation', () => {
    const standard = new StandardDelivery();
    const express = new ExpressDelivery();
    const eco = new EcoCycleDelivery();

    expect(standard.calculateFee(3, 550)).toBe(0);
    expect(standard.calculateFee(3, 300)).toBe(44);
    expect(express.calculateFee(3)).toBe(83);
    expect(eco.calculateFee(3)).toBe(20);
    expect(() => eco.calculateFee(6.2)).toThrow(ValidationException);
  });

  it('throws domain exceptions on invalid cart and restaurant operations', () => {
    const system = new FoodDeliverySystem({ seedSampleOrder: false });

    expect(() => system.calculateBillPreview('standard')).toThrow(EmptyCartException);
    expect(() => system.getOrder('ORD-MISSING')).toThrow(EntityNotFoundException);
    expect(() => system.addToCart('rest-zaffran', 'zf-biryani', 25)).toThrow(
      InvalidQuantityException,
    );
    expect(() => system.addToCart('rest-chai', 'cb-croissant', 1)).toThrow(
      ItemUnavailableException,
    );

    system.toggleRestaurantOpen('rest-zaffran');
    expect(() => system.addToCart('rest-zaffran', 'zf-biryani', 1)).toThrow(
      RestaurantClosedException,
    );
    system.toggleRestaurantOpen('rest-zaffran');

    system.addToCart('rest-zaffran', 'zf-biryani', 1);
    expect(() => system.addToCart('rest-forno', 'fr-margherita', 1)).toThrow(
      MixedRestaurantOrderException,
    );
  });

  it('places an order, calculates total bill, generates summary, and guards order state transitions', () => {
    const system = new FoodDeliverySystem({ seedSampleOrder: false });

    system.addToCart('rest-zaffran', 'zf-biryani', 1, { extraCheese: true });
    system.addToCart('rest-zaffran', 'zf-lassi', 2, { beverageSize: 'Large', iced: true });

    const summary = system.placeOrder({
      recipientName: 'Abdus Samad Sk',
      phone: '+91 9876543211',
      email: 'samad@example.com',
      address: '15 College Street, Near Presidency',
      deliveryMode: 'standard',
      promoCode: 'GROUP13',
    });

    expect(summary.orderId).toBe('ORD-1041');
    expect(summary.items).toHaveLength(2);
    expect(summary.bill.itemsSubtotal).toBe(344 + 161 * 2); // 344 + 322 = 666
    expect(summary.bill.totalPackagingFee).toBe(15 + 20); // 35
    expect(summary.bill.deliveryFee).toBe(0); // >= 499 free standard delivery
    expect(summary.bill.discountAmount).toBe(100); // min(120, round(666 * 0.15)) = 100
    expect(summary.bill.grandTotal).toBe(566 + 35 + 0 + Math.round(566 * 0.05)); // 566 + 35 + 28 = 629
    expect(system.getCartItemCount()).toBe(0);

    // Advance order lifecycle: PLACED -> CONFIRMED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED
    expect(system.advanceOrderStatus(summary.orderId)).toBe('CONFIRMED');
    expect(system.advanceOrderStatus(summary.orderId)).toBe('PREPARING');
    expect(system.advanceOrderStatus(summary.orderId)).toBe('OUT_FOR_DELIVERY');

    // Cannot cancel once out for delivery
    expect(() => system.cancelOrder(summary.orderId)).toThrow(OrderStateTransitionException);

    expect(system.advanceOrderStatus(summary.orderId)).toBe('DELIVERED');
    // Cannot advance past delivered
    expect(() => system.advanceOrderStatus(summary.orderId)).toThrow(
      OrderStateTransitionException,
    );
  });

  it('validates Supabase authentication flows, maps user metadata, and protects checkout', async () => {
    const system = new FoodDeliverySystem({ seedSampleOrder: false });
    expect(() => system.assertAuthenticatedForCheckout(true)).toThrow(AuthenticationException);

    const unconfiguredAuth = new SupabaseAuthService(null);
    await expect(
      unconfiguredAuth.signInWithPassword('sohan@example.com', 'secret123'),
    ).rejects.toThrow(AuthenticationException);

    const fakeUser = {
      id: 'uid-147',
      email: 'taufique@example.com',
      email_confirmed_at: '2026-11-12T00:00:00Z',
      created_at: '2026-11-12T00:00:00Z',
      user_metadata: {
        full_name: 'Md Taufique Anwar Ansari',
        phone: '+91 9876501234',
        address: '88 Residency Road, Salt Lake Sector V',
        landmark: 'Near Tech Tower',
      },
    } as unknown as User;

    const fakeClient = {
      auth: {
        signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
          if (email === 'taufique@example.com' && password === 'pass1234') {
            return { data: { user: fakeUser }, error: null };
          }
          return { data: { user: null }, error: { message: 'Invalid login credentials' } };
        },
      },
    } as unknown as SupabaseClient;

    const authService = new SupabaseAuthService(fakeClient);
    await expect(authService.signInWithPassword('bad-email', 'pass1234')).rejects.toThrow(
      ValidationException,
    );
    await expect(
      authService.signInWithPassword('taufique@example.com', 'wrongpass'),
    ).rejects.toThrow(AuthenticationException);

    const profile = await authService.signInWithPassword('taufique@example.com', 'pass1234');
    expect(profile.fullName).toBe('Md Taufique Anwar Ansari');
    expect(mapSupabaseUserToProfile(fakeUser).emailConfirmed).toBe(true);

    system.syncAuthenticatedCustomer(profile);
    expect(system.authenticatedUserId).toBe('uid-147');
    expect(system.customer.name).toBe('Md Taufique Anwar Ansari');
    expect(system.customer.email).toBe('taufique@example.com');
    expect(() => system.assertAuthenticatedForCheckout(true)).not.toThrow();
  });
});

