import { Response } from 'express';
import * as entryService from '../services/entries.service';
import { AuthRequest } from '../types/auth.types';

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const { from, to } = req.query as Record<string, string>;
  const entries = await entryService.listEntries(req.user!.userId, { from, to });
  res.json(entries);
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  const entry = await entryService.createEntry(req.user!.userId, req.body);
  res.status(201).json(entry);
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  const entry = await entryService.updateEntry(req.user!.userId, req.params.id, req.body);
  res.json(entry);
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  await entryService.deleteEntry(req.user!.userId, req.params.id);
  res.status(204).send();
}

export async function daily(req: AuthRequest, res: Response): Promise<void> {
  const summary = await entryService.getDailySummary(
    req.user!.userId,
    req.params.date,
  );
  res.json(summary);
}
