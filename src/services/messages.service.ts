import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { emitToGroup } from '../config/socket';
import { assertMember } from './groups.service';

const messageInclude = {
  user: { select: { id: true, username: true, avatarUrl: true } },
  reactions: {
    include: { user: { select: { id: true, username: true } } },
  },
} as const;

export async function listMessages(
  groupId: string,
  userId: string,
  { skip = 0, take = 50 }: { skip?: number; take?: number } = {},
) {
  await assertMember(groupId, userId);
  return prisma.groupMessage.findMany({
    where: { groupId },
    include: messageInclude,
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });
}

export async function createMessage(userId: string, groupId: string, text: string) {
  await assertMember(groupId, userId);
  const message = await prisma.groupMessage.create({
    data: { groupId, userId, text },
    include: messageInclude,
  });

  emitToGroup(groupId, 'message:new', message);
  return message;
}

export async function addReaction(userId: string, messageId: string, emoji: string) {
  const message = await prisma.groupMessage.findUnique({
    where: { id: messageId },
    select: { groupId: true },
  });
  if (!message) throw new NotFoundError('Message not found');
  await assertMember(message.groupId, userId);

  const reaction = await prisma.groupMessageReaction.upsert({
    where: { messageId_userId: { messageId, userId } },
    create: { messageId, userId, emoji },
    update: { emoji },
    include: { user: { select: { id: true, username: true } } },
  });

  emitToGroup(message.groupId, 'reaction:new', { messageId, reaction });
  return reaction;
}

export async function removeReaction(userId: string, messageId: string) {
  const message = await prisma.groupMessage.findUnique({
    where: { id: messageId },
    select: { groupId: true },
  });
  if (!message) throw new NotFoundError('Message not found');

  await prisma.groupMessageReaction.deleteMany({ where: { messageId, userId } });
  emitToGroup(message.groupId, 'reaction:removed', { messageId, userId });
}
