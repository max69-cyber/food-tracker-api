import { Request, Response } from 'express';
import * as groupService from '../services/groups.service';
import { AuthRequest } from '../types/auth.types';

export async function list(_req: Request, res: Response): Promise<void> {
  res.json(await groupService.listGroups());
}

export async function get(req: AuthRequest, res: Response): Promise<void> {
  res.json(await groupService.getGroup(req.params.id));
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  const group = await groupService.createGroup(req.user!.userId, req.body);
  res.status(201).json(group);
}

export async function join(req: AuthRequest, res: Response): Promise<void> {
  const member = await groupService.joinGroup(req.user!.userId, req.params.id);
  res.status(201).json(member);
}

export async function leave(req: AuthRequest, res: Response): Promise<void> {
  await groupService.leaveGroup(req.user!.userId, req.params.id);
  res.status(204).send();
}

export async function members(req: AuthRequest, res: Response): Promise<void> {
  res.json(await groupService.listMembers(req.params.id, req.user!.userId));
}

export async function vote(req: AuthRequest, res: Response): Promise<void> {
  const { foodId, voteDate } = req.body;
  const result = await groupService.castVote(
    req.user!.userId,
    req.params.id,
    foodId,
    voteDate,
  );
  res.status(201).json(result);
}

export async function voteResults(req: AuthRequest, res: Response): Promise<void> {
  const { date } = req.query as Record<string, string>;
  const results = await groupService.getVoteResults(
    req.params.id,
    req.user!.userId,
    date,
  );
  res.json(results);
}

export async function closeVoting(req: AuthRequest, res: Response): Promise<void> {
  const { voteDate } = req.body;
  const winner = await groupService.closeVoting(
    req.user!.userId,
    req.params.id,
    voteDate,
  );
  res.status(201).json(winner);
}

export async function winners(req: AuthRequest, res: Response): Promise<void> {
  res.json(await groupService.listWinners(req.params.id, req.user!.userId));
}
