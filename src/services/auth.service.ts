import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { TokenPair } from '../types/auth.types';

interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const publicUser = {
  id: true,
  email: true,
  username: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
    select: { email: true, username: true },
  });

  if (existing) {
    const field = existing.email === input.email ? 'email' : 'username';
    throw new ConflictError(`User with this ${field} already exists`);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, username: input.username, passwordHash },
    select: publicUser,
  });

  const tokens = generateTokens({ userId: user.id, email: user.email });
  return { user, ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const ok = await comparePassword(input.password, user.passwordHash);
  if (!ok) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const tokens = generateTokens({ userId: user.id, email: user.email });
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}

export async function refresh(refreshToken: string): Promise<TokenPair> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Make sure the user still exists.
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new UnauthorizedError('User no longer exists');
  }

  return generateTokens({ userId: user.id, email: user.email });
}

export function getProfile(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: publicUser });
}
