import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { PrismaClient, User } from '@prisma/client';

interface TokenUser {
  id: string;
  email: string;
  name: string;
  role: string;
  products: string[];
}

export function generateAccessToken(user: TokenUser): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
  };
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      products: user.products,
    },
    process.env.JWT_SECRET!,
    options,
  );
}

export function generateRefreshToken(): string {
  return uuid();
}

export async function createRefreshToken(
  prisma: PrismaClient,
  userId: string
): Promise<string> {
  const token = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
  return token;
}

export async function getUserProducts(
  prisma: PrismaClient,
  userId: string
): Promise<string[]> {
  const subs = await prisma.subscription.findMany({
    where: { userId, status: { in: ['ACTIVE', 'TRIAL'] } },
    select: { product: true },
  });
  return subs.map((s) => s.product);
}

export async function buildTokenUser(
  prisma: PrismaClient,
  user: User
): Promise<TokenUser> {
  const products = await getUserProducts(prisma, user.id);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    products,
  };
}
