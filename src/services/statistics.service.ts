import { prisma } from '../config/database';
import { UnitType } from '../generated/prisma/client';
import { startOfUTCDay, endOfUTCDay, parseDateOnly } from '../utils/date';

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodMacros {
  calories: number;
  protein: unknown;
  carbs: unknown;
  fat: unknown;
}

/**
 * Computes the nutrition for a portion.
 * - gram: values are per 100g, so scale by quantity / 100
 * - piece / ml: values are treated as per-unit, so scale by quantity
 */
export function computeNutrition(
  food: FoodMacros,
  quantity: number,
  unit: UnitType,
): Nutrition {
  const factor = unit === 'gram' ? quantity / 100 : quantity;
  return {
    calories: Math.round(food.calories * factor),
    protein: Number(food.protein) * factor,
    carbs: Number(food.carbs) * factor,
    fat: Number(food.fat) * factor,
  };
}

/** Recomputes and stores the denormalized daily stats for a user. */
export async function recalcUserStats(userId: string, day: Date): Promise<void> {
  const start = startOfUTCDay(day);
  const end = endOfUTCDay(day);

  const entries = await prisma.foodEntry.findMany({
    where: { userId, eatenAt: { gte: start, lt: end } },
    include: { food: true },
  });

  if (entries.length === 0) {
    await prisma.userStatistics.deleteMany({ where: { userId, date: start } });
    return;
  }

  const totals = entries.reduce<Nutrition>(
    (acc, e) => {
      const n = computeNutrition(e.food, Number(e.quantity), e.unit);
      acc.calories += n.calories;
      acc.protein += n.protein;
      acc.carbs += n.carbs;
      acc.fat += n.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const data = {
    totalCalories: Math.round(totals.calories),
    totalProtein: totals.protein.toFixed(2),
    totalCarbs: totals.carbs.toFixed(2),
    totalFat: totals.fat.toFixed(2),
    entriesCount: entries.length,
  };

  await prisma.userStatistics.upsert({
    where: { userId_date: { userId, date: start } },
    create: { userId, date: start, ...data },
    update: data,
  });
}

/** Recomputes the denormalized daily stats for a whole group (all members). */
export async function recalcGroupStats(groupId: string, day: Date): Promise<void> {
  const start = startOfUTCDay(day);
  const end = endOfUTCDay(day);

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });
  const memberIds = members.map((m) => m.userId);

  if (memberIds.length === 0) {
    await prisma.groupStatistics.deleteMany({ where: { groupId, date: start } });
    return;
  }

  const entries = await prisma.foodEntry.findMany({
    where: { userId: { in: memberIds }, eatenAt: { gte: start, lt: end } },
    include: { food: true },
  });

  if (entries.length === 0) {
    await prisma.groupStatistics.deleteMany({ where: { groupId, date: start } });
    return;
  }

  const activeMembers = new Set<string>();
  const totals = entries.reduce<Nutrition>(
    (acc, e) => {
      activeMembers.add(e.userId);
      const n = computeNutrition(e.food, Number(e.quantity), e.unit);
      acc.calories += n.calories;
      acc.protein += n.protein;
      acc.carbs += n.carbs;
      acc.fat += n.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const data = {
    totalCalories: Math.round(totals.calories),
    totalProtein: totals.protein.toFixed(2),
    totalCarbs: totals.carbs.toFixed(2),
    totalFat: totals.fat.toFixed(2),
    entriesCount: entries.length,
    membersCount: activeMembers.size,
  };

  await prisma.groupStatistics.upsert({
    where: { groupId_date: { groupId, date: start } },
    create: { groupId, date: start, ...data },
    update: data,
  });
}

export function getUserStats(userId: string, from?: string, to?: string) {
  return prisma.userStatistics.findMany({
    where: {
      userId,
      date: {
        ...(from ? { gte: parseDateOnly(from) } : {}),
        ...(to ? { lte: parseDateOnly(to) } : {}),
      },
    },
    orderBy: { date: 'asc' },
  });
}

export function getGroupStats(groupId: string, from?: string, to?: string) {
  return prisma.groupStatistics.findMany({
    where: {
      groupId,
      date: {
        ...(from ? { gte: parseDateOnly(from) } : {}),
        ...(to ? { lte: parseDateOnly(to) } : {}),
      },
    },
    orderBy: { date: 'asc' },
  });
}
