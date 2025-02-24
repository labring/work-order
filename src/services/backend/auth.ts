import { TokenPayload, UserDB } from '@/types/user';
import { verify, sign, JwtPayload } from 'jsonwebtoken';
import type { NextApiRequest } from 'next';
import { ERROR_ENUM } from '../error';

const jwtSecret = (process.env.JWT_SECRET as string) || '123456789';

export const verifyAccessToken = async (req: NextApiRequest) => {
  if (!req.headers) return Promise.reject(ERROR_ENUM.unAuthorization);
  const { authorization } = req.headers;
  if (!authorization) return Promise.reject(ERROR_ENUM.unAuthorization);
  return verifyToken(authorization);
};

export const verifyToken = <T extends Object = TokenPayload>(token: string) =>
  new Promise<T | null>((resolve) => {
    verify(token, jwtSecret, (err, payload) => {
      if (err) {
        console.log(err);
        resolve(null);
      } else if (!payload) {
        console.log('payload is null');
        resolve(null);
      } else {
        resolve(payload as T);
      }
    });
  });

export const generateAccessToken = (props: {
  userId: string;
  username: string;
  isAdmin: boolean;
}) => sign(props, jwtSecret, { expiresIn: '7d' });
