import { GET, POST } from '@/services/request';
import { AppSession, UserDB } from '@/types/user';

export const findUserById = ({ orderId }: { orderId: string }) =>
  GET<{ user: UserDB; workorderLink: string }>('/api/auth/findById', {
    orderId: orderId
  });

// export const AuthByDesktopSession = (payload: { token: string }) =>
//   POST<AppSession>('/api/auth/desktop', payload);

export const AuthByToken = (token: string) => POST<AppSession>('/api/auth/token', { token });
