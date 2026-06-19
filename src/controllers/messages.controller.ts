import { Response } from 'express';
import * as messageService from '../services/messages.service';
import { AuthRequest } from '../types/auth.types';

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const { skip, take } = req.query as Record<string, string>;
  const messages = await messageService.listMessages(req.params.id, req.user!.userId, {
    skip: skip ? Number(skip) : undefined,
    take: take ? Number(take) : undefined,
  });
  res.json(messages);
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  const message = await messageService.createMessage(
    req.user!.userId,
    req.params.id,
    req.body.text,
  );
  res.status(201).json(message);
}

export async function react(req: AuthRequest, res: Response): Promise<void> {
  const reaction = await messageService.addReaction(
    req.user!.userId,
    req.params.messageId,
    req.body.emoji,
  );
  res.status(201).json(reaction);
}

export async function unreact(req: AuthRequest, res: Response): Promise<void> {
  await messageService.removeReaction(req.user!.userId, req.params.messageId);
  res.status(204).send();
}
