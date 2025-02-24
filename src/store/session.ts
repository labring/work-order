import { AuthByToken } from '@/api/user';
import { AppSession } from '@/types/user';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

export const sessionKey = 'session';

type State = {
  session: AppSession | null;
  authUser: (token: string) => Promise<AppSession>;
  setAppSession: (session: AppSession) => void;
  delAppSession: () => void;
};

const useSessionStore = create<State>()(
  persist(
    immer((set, get) => ({
      session: null,
      authUser: async (token) => {
        const data = await AuthByToken(token);
        set((state) => {
          state.session = {
            token: data.token,
            userId: data.userId,
            isAdmin: data.isAdmin,
            username: data.username
          };
        });
        return data;
      },
      setAppSession: (session) => {
        set({ session });
      },
      delAppSession: () => {
        set({ session: null });
      }
    })),
    {
      name: sessionKey
    }
  )
);

export default useSessionStore;
