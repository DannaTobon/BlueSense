import { FieldValue, type Firestore } from 'firebase-admin/firestore';

import { getFirebaseAdminFirestore } from '../auth/firebase-admin.js';

import {
  WaterContainerDataIntegrityError,
  WaterContainerPersistenceUnavailableError,
  type WaterContainerRecord,
  type WaterContainerRepository,
} from './water-container-repository.js';

const COLLECTION_NAME = 'waterContainerDrafts';

interface FirestoreWaterContainerDocument {
  readonly ownerUid: string;
  readonly type: 'VERTICAL_CYLINDER' | 'RECTANGULAR';
  readonly capacityLiters: number | null;
  readonly heightCm: number;
  readonly calibration: { readonly emptyDistanceCm: number; readonly fullDistanceCm: number };
  readonly dimensions: Record<string, number>;
  readonly updatedAt: FieldValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function toFirestoreWaterContainerDocument(
  record: WaterContainerRecord,
): FirestoreWaterContainerDocument {
  return {
    ownerUid: record.ownerUid,
    type: record.type,
    capacityLiters: record.capacityLiters,
    heightCm: record.heightCm,
    calibration: { ...record.calibration },
    dimensions: { ...record.dimensions },
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export function fromFirestoreWaterContainerDocument(
  value: unknown,
  expectedOwnerUid: string,
): WaterContainerRecord {
  if (!isRecord(value) || !isRecord(value.dimensions) || !isRecord(value.calibration)) {
    throw new WaterContainerDataIntegrityError();
  }

  const { ownerUid, type, capacityLiters, heightCm, calibration, dimensions } = value;
  const emptyDistanceCm = calibration.emptyDistanceCm;
  const fullDistanceCm = calibration.fullDistanceCm;

  if (
    ownerUid !== expectedOwnerUid ||
    (capacityLiters !== null && !isPositiveFiniteNumber(capacityLiters)) ||
    !isPositiveFiniteNumber(heightCm) ||
    !isPositiveFiniteNumber(emptyDistanceCm) ||
    !isPositiveFiniteNumber(fullDistanceCm) ||
    fullDistanceCm >= emptyDistanceCm ||
    emptyDistanceCm - fullDistanceCm > heightCm
  ) {
    throw new WaterContainerDataIntegrityError();
  }

  const base = {
    ownerUid,
    capacityLiters,
    heightCm,
    calibration: { emptyDistanceCm, fullDistanceCm },
  } as const;

  if (
    type === 'VERTICAL_CYLINDER' &&
    Object.keys(dimensions).length === 1 &&
    isPositiveFiniteNumber(dimensions.radiusCm)
  ) {
    return { ...base, type, dimensions: { radiusCm: dimensions.radiusCm } };
  }

  if (
    type === 'RECTANGULAR' &&
    Object.keys(dimensions).length === 2 &&
    isPositiveFiniteNumber(dimensions.lengthCm) &&
    isPositiveFiniteNumber(dimensions.widthCm)
  ) {
    return {
      ...base,
      type,
      dimensions: { lengthCm: dimensions.lengthCm, widthCm: dimensions.widthCm },
    };
  }

  throw new WaterContainerDataIntegrityError();
}

export class FirestoreWaterContainerRepository implements WaterContainerRepository {
  constructor(private readonly getFirestore: () => Firestore = getFirebaseAdminFirestore) {}

  async findByOwnerUid(ownerUid: string): Promise<WaterContainerRecord | null> {
    try {
      const snapshot = await this.getFirestore().collection(COLLECTION_NAME).doc(ownerUid).get();
      return snapshot.exists
        ? fromFirestoreWaterContainerDocument(snapshot.data(), ownerUid)
        : null;
    } catch (error: unknown) {
      if (error instanceof WaterContainerDataIntegrityError) {
        throw error;
      }

      throw new WaterContainerPersistenceUnavailableError({ cause: error });
    }
  }

  async save(record: WaterContainerRecord): Promise<void> {
    try {
      await this.getFirestore()
        .collection(COLLECTION_NAME)
        .doc(record.ownerUid)
        .set(toFirestoreWaterContainerDocument(record));
    } catch (error: unknown) {
      throw new WaterContainerPersistenceUnavailableError({ cause: error });
    }
  }
}
