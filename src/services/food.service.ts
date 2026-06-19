import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';

interface FoodInput {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description?: string;
  category?: string;
  imageUrl?: string;
}

interface ListFoodParams {
  search?: string;
  category?: string;
  skip?: number;
  take?: number;
}

export function listFoods({ search, category, skip = 0, take = 50 }: ListFoodParams) {
  return prisma.food.findMany({
    where: {
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { upvotes: 'desc' },
    skip,
    take,
  });
}

export async function getFood(id: string) {
  const food = await prisma.food.findUnique({ where: { id } });
  if (!food) throw new NotFoundError('Food not found');
  return food;
}

export function createFood(userId: string, data: FoodInput) {
  return prisma.food.create({
    data: { ...data, createdByUserId: userId },
  });
}

export async function updateFood(userId: string, id: string, data: Partial<FoodInput>) {
  const food = await getFood(id);
  if (food.createdByUserId !== userId) {
    throw new ForbiddenError('You can only edit foods you created');
  }
  return prisma.food.update({ where: { id }, data });
}

export async function deleteFood(userId: string, id: string) {
  const food = await getFood(id);
  if (food.createdByUserId !== userId) {
    throw new ForbiddenError('You can only delete foods you created');
  }
  await prisma.food.delete({ where: { id } });
}

/** Toggle an upvote. Returns the new upvote state and counter. */
export async function toggleUpvote(userId: string, foodId: string) {
  await getFood(foodId);

  const existing = await prisma.foodUpvote.findUnique({
    where: { userId_foodId: { userId, foodId } },
  });

  return prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.foodUpvote.delete({ where: { id: existing.id } });
      const food = await tx.food.update({
        where: { id: foodId },
        data: { upvotes: { decrement: 1 } },
      });
      return { upvoted: false, upvotes: food.upvotes };
    }

    await tx.foodUpvote.create({ data: { userId, foodId } });
    const food = await tx.food.update({
      where: { id: foodId },
      data: { upvotes: { increment: 1 } },
    });
    return { upvoted: true, upvotes: food.upvotes };
  });
}
