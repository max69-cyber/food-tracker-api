import { prisma } from '../config/database';
import { UnitType } from '../generated/prisma/client';
import { NotFoundError } from '../utils/errors';
import { computeNutrition, recalcUserStats } from './statistics.service';
import { parseDateOnly, endOfUTCDay, startOfUTCDay } from '../utils/date';

interface EntryInput {
  foodId: string;
  quantity: number;
  unit: UnitType;
  eatenAt: string; // ISO datetime
}

interface ListEntryParams {
  from?: string;
  to?: string;
}

/** Attaches a computed `nutrition` object to an entry that includes its food. */
function withNutrition<T extends { quantity: unknown; unit: UnitType; food: Parameters<typeof computeNutrition>[0] }>(
  entry: T,
) {
  return {
    ...entry,
    nutrition: computeNutrition(entry.food, Number(entry.quantity), entry.unit),
  };
}

export async function listEntries(userId: string, { from, to }: ListEntryParams) {
  const entries = await prisma.foodEntry.findMany({
    where: {
      userId,
      eatenAt: {
        ...(from ? { gte: startOfUTCDay(parseDateOnly(from)) } : {}),
        ...(to ? { lt: endOfUTCDay(parseDateOnly(to)) } : {}),
      },
    },
    include: { food: true },
    orderBy: { eatenAt: 'desc' },
  });
  return entries.map(withNutrition);
}

export async function createEntry(userId: string, data: EntryInput) {
  const eatenAt = new Date(data.eatenAt);
  const entry = await prisma.foodEntry.create({
    data: {
      userId,
      foodId: data.foodId,
      quantity: data.quantity,
      unit: data.unit,
      eatenAt,
    },
    include: { food: true },
  });

  await recalcUserStats(userId, eatenAt);
  return withNutrition(entry);
}

export async function updateEntry(userId: string, id: string, data: Partial<EntryInput>) {
  const existing = await prisma.foodEntry.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError('Entry not found');

  const newEatenAt = data.eatenAt ? new Date(data.eatenAt) : existing.eatenAt;

  const entry = await prisma.foodEntry.update({
    where: { id },
    data: {
      ...(data.foodId !== undefined ? { foodId: data.foodId } : {}),
      ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
      ...(data.unit !== undefined ? { unit: data.unit } : {}),
      ...(data.eatenAt !== undefined ? { eatenAt: newEatenAt } : {}),
    },
    include: { food: true },
  });

  // Recompute stats for both the old and new day if the date moved.
  await recalcUserStats(userId, existing.eatenAt);
  if (newEatenAt.getTime() !== existing.eatenAt.getTime()) {
    await recalcUserStats(userId, newEatenAt);
  }
  return withNutrition(entry);
}

export async function deleteEntry(userId: string, id: string) {
  const existing = await prisma.foodEntry.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError('Entry not found');

  await prisma.foodEntry.delete({ where: { id } });
  await recalcUserStats(userId, existing.eatenAt);
}

/** Live (non-denormalized) totals for a single day. */
export async function getDailySummary(userId: string, dateStr: string) {
  const day = parseDateOnly(dateStr);
  const entries = await prisma.foodEntry.findMany({
    where: { userId, eatenAt: { gte: startOfUTCDay(day), lt: endOfUTCDay(day) } },
    include: { food: true },
  });

  const items = entries.map(withNutrition);
  const totals = items.reduce(
    (acc, e) => ({
      calories: acc.calories + e.nutrition.calories,
      protein: acc.protein + e.nutrition.protein,
      carbs: acc.carbs + e.nutrition.carbs,
      fat: acc.fat + e.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return { date: dateStr, entriesCount: items.length, totals, entries: items };
}
