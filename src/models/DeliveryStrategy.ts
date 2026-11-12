import { ValidationException } from './Exceptions';

export type DeliveryModeId = 'standard' | 'express' | 'eco';

/**
 * Abstract strategy defining polymorphic delivery fee and ETA calculation.
 */
export abstract class DeliveryStrategy {
  public abstract readonly modeId: DeliveryModeId;
  public abstract readonly label: string;
  public abstract readonly description: string;

  public abstract calculateFee(distanceKm: number, itemsSubtotal: number): number;
  public abstract estimateMinutes(basePrepMinutes: number, distanceKm: number): number;
}

/** Standard doorstep delivery — free on orders ₹499 or above. */
export class StandardDelivery extends DeliveryStrategy {
  public readonly modeId: DeliveryModeId = 'standard';
  public readonly label = 'Standard Delivery';
  public readonly description = 'Free on orders ₹499+ • Reliable doorstep drop';

  public override calculateFee(distanceKm: number, itemsSubtotal: number): number {
    if (itemsSubtotal >= 499) {
      return 0;
    }
    return Math.round(29 + distanceKm * 5);
  }

  public override estimateMinutes(basePrepMinutes: number, distanceKm: number): number {
    return Math.round(basePrepMinutes + distanceKm * 4 + 8);
  }
}

/** Priority express courier with dedicated routing and faster arrival. */
export class ExpressDelivery extends DeliveryStrategy {
  public readonly modeId: DeliveryModeId = 'express';
  public readonly label = 'Priority Express';
  public readonly description = 'Direct courier • ~10 mins faster arrival';

  public override calculateFee(distanceKm: number): number {
    return Math.round(59 + distanceKm * 8);
  }

  public override estimateMinutes(basePrepMinutes: number, distanceKm: number): number {
    return Math.max(15, Math.round(basePrepMinutes + distanceKm * 2.5 + 2));
  }
}

/** Low-emission EV cycle delivery restricted to short-distance orders (<= 5 km). */
export class EcoCycleDelivery extends DeliveryStrategy {
  public readonly modeId: DeliveryModeId = 'eco';
  public readonly label = 'Eco EV Cycle';
  public readonly description = 'Flat ₹20 • Zero-emission delivery within 5 km';

  public override calculateFee(distanceKm: number): number {
    if (distanceKm > 5) {
      throw new ValidationException(
        `Eco EV Cycle delivery is available within 5 km only (restaurant is ${distanceKm.toFixed(1)} km away).`,
        { distanceKm, maxKm: 5 },
      );
    }
    return 20;
  }

  public override estimateMinutes(basePrepMinutes: number, distanceKm: number): number {
    return Math.round(basePrepMinutes + distanceKm * 5 + 6);
  }
}

export const DELIVERY_STRATEGIES: Record<DeliveryModeId, DeliveryStrategy> = {
  standard: new StandardDelivery(),
  express: new ExpressDelivery(),
  eco: new EcoCycleDelivery(),
};

