import { Request, Response } from 'express';
import * as foodService from '../services/food.service';
import { AuthRequest } from '../types/auth.types';

export async function list(req: Request, res: Response): Promise<void> {
  const { search, category, skip, take } = req.query as Record<string, string>;
  const foods = await foodService.listFoods({
    search,
    category,
    skip: skip ? Number(skip) : undefined,
    take: take ? Number(take) : undefined,
  });
  res.json(foods);
}

export async function get(req: AuthRequest, res: Response): Promise<void> {
  const food = await foodService.getFood(req.params.id);
  res.json(food);
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  const food = await foodService.createFood(req.user!.userId, req.body);
  res.status(201).json(food);
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  const food = await foodService.updateFood(req.user!.userId, req.params.id, req.body);
  res.json(food);
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  await foodService.deleteFood(req.user!.userId, req.params.id);
  res.status(204).send();
}

export async function upvote(req: AuthRequest, res: Response): Promise<void> {
  const result = await foodService.toggleUpvote(req.user!.userId, req.params.id);
  res.json(result);
}
