import { prisma } from '../config/database';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors';
import { parseDateOnly } from '../utils/date';

interface GroupInput {
  name: string;
  description?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
  maxMembers?: number;
}

export async function assertMember(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) throw new ForbiddenError('You are not a member of this group');
  return member;
}

export function listGroups() {
  return prisma.group.findMany({
    where: { isPrivate: false },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getGroup(id: string) {
  const group = await prisma.group.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  });
  if (!group) throw new NotFoundError('Group not found');
  return group;
}

export async function createGroup(userId: string, data: GroupInput) {
  return prisma.group.create({
    data: {
      ...data,
      createdByUserId: userId,
      members: { create: { userId } }, // creator joins automatically
    },
    include: { _count: { select: { members: true } } },
  });
}

export async function joinGroup(userId: string, groupId: string) {
  const group = await getGroup(groupId);

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (existing) throw new ConflictError('You are already a member');

  if (group.maxMembers && group._count.members >= group.maxMembers) {
    throw new ConflictError('Group is full');
  }

  return prisma.groupMember.create({ data: { groupId, userId } });
}

export async function leaveGroup(userId: string, groupId: string) {
  await assertMember(groupId, userId);
  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
}

export async function listMembers(groupId: string, userId: string) {
  await assertMember(groupId, userId);
  return prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { joinedAt: 'asc' },
  });
}

/** Cast (or change) a member's vote for a food on a given day. */
export async function castVote(
  userId: string,
  groupId: string,
  foodId: string,
  voteDateStr: string,
) {
  await assertMember(groupId, userId);
  const voteDate = parseDateOnly(voteDateStr);

  return prisma.groupVote.upsert({
    where: { groupId_userId_voteDate: { groupId, userId, voteDate } },
    create: { groupId, userId, foodId, voteDate },
    update: { foodId, votedAt: new Date() },
  });
}

/** Tally of votes per food for a group/day. */
export async function getVoteResults(
  groupId: string,
  userId: string,
  voteDateStr: string,
) {
  await assertMember(groupId, userId);
  const voteDate = parseDateOnly(voteDateStr);

  const grouped = await prisma.groupVote.groupBy({
    by: ['foodId'],
    where: { groupId, voteDate },
    _count: { foodId: true },
    orderBy: { _count: { foodId: 'desc' } },
  });

  const foods = await prisma.food.findMany({
    where: { id: { in: grouped.map((g) => g.foodId) } },
  });
  const foodMap = new Map(foods.map((f) => [f.id, f]));

  return grouped.map((g) => ({
    food: foodMap.get(g.foodId) ?? null,
    votes: g._count.foodId,
  }));
}

/** Closes voting for a day: finds the winner and records it. */
export async function closeVoting(
  userId: string,
  groupId: string,
  voteDateStr: string,
) {
  const group = await getGroup(groupId);
  if (group.createdByUserId !== userId) {
    throw new ForbiddenError('Only the group owner can close voting');
  }

  const voteDate = parseDateOnly(voteDateStr);
  const results = await prisma.groupVote.groupBy({
    by: ['foodId'],
    where: { groupId, voteDate },
    _count: { foodId: true },
    orderBy: { _count: { foodId: 'desc' } },
  });

  if (results.length === 0) {
    throw new BadRequestError('No votes were cast for this day');
  }

  const top = results[0];
  return prisma.groupVoteWinner.upsert({
    where: { groupId_winnerDate: { groupId, winnerDate: voteDate } },
    create: {
      groupId,
      winnerDate: voteDate,
      foodId: top.foodId,
      voteCount: top._count.foodId,
    },
    update: { foodId: top.foodId, voteCount: top._count.foodId },
    include: { food: true },
  });
}

export async function listWinners(groupId: string, userId: string) {
  await assertMember(groupId, userId);
  return prisma.groupVoteWinner.findMany({
    where: { groupId },
    include: { food: true },
    orderBy: { winnerDate: 'desc' },
  });
}
