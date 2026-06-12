import bcrypt from 'bcryptjs';
import prisma from '@config/database';
import { AppError } from '@middleware/errorHandler';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@utils/jwt';

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already registered', 409, 'DUPLICATE_ENTRY');

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: (data.role as any) ?? 'OPERATIONS_MANAGER',
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  return {
    user,
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive)
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const refreshTokens = async (token: string) => {
  const payload = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || !user.isActive) throw new AppError('User not found or inactive', 401, 'UNAUTHORIZED');

  const newPayload = { id: user.id, name: user.name, email: user.email, role: user.role };
  return {
    accessToken: generateAccessToken(newPayload),
    refreshToken: generateRefreshToken(newPayload),
  };
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
};
