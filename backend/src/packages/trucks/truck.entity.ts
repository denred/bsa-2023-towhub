import { type IEntity } from '~/libs/interfaces/interfaces.js';
import { type NullableProperties } from '~/libs/types/types.js';

import { type TruckEntity as TruckEntityT } from './libs/types/types.js';

class TruckEntity implements IEntity {
  private id: number | null;

  private createdAt: Date;

  private updatedAt: Date;

  private manufacturer: string;

  private capacity: number;

  private pricePerKm: number;

  private licensePlateNumber: string;

  private constructor({
    id,
    createdAt,
    updatedAt,
    manufacturer,
    capacity,
    pricePerKm,
    licensePlateNumber,
  }: NullableProperties<TruckEntityT, 'id'>) {
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.manufacturer = manufacturer;
    this.capacity = capacity;
    this.pricePerKm = pricePerKm;
    this.licensePlateNumber = licensePlateNumber;
  }

  public static initialize({
    id,
    createdAt,
    updatedAt,
    manufacturer,
    capacity,
    pricePerKm,
    licensePlateNumber,
  }: TruckEntityT): TruckEntity {
    return new TruckEntity({
      id,
      createdAt,
      updatedAt,
      manufacturer,
      capacity,
      pricePerKm,
      licensePlateNumber,
    });
  }

  public static initializeNew({
    manufacturer,
    capacity,
    pricePerKm,
    licensePlateNumber,
  }: Omit<TruckEntityT, 'id' | 'createdAt' | 'updatedAt'>): TruckEntity {
    return new TruckEntity({
      id: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      manufacturer,
      capacity,
      pricePerKm,
      licensePlateNumber,
    });
  }

  public toObject(): Omit<TruckEntityT, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      manufacturer: this.manufacturer,
      capacity: this.capacity,
      pricePerKm: this.pricePerKm,
      licensePlateNumber: this.licensePlateNumber,
    };
  }

  public toNewObject(): Omit<TruckEntityT, 'id' | 'createdAt'> {
    return {
      updatedAt: new Date(),
      manufacturer: this.manufacturer,
      capacity: this.capacity,
      pricePerKm: this.pricePerKm,
      licensePlateNumber: this.licensePlateNumber,
    };
  }
}

export { TruckEntity };
