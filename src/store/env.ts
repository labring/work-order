import { getSystemEnv } from '@/api/platform';
import { SystemEnvResponse } from '@/pages/api/platform/getEnv';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type EnvState = {
  SystemEnv: Partial<SystemEnvResponse>;
  initSystemEnv: () => Promise<SystemEnvResponse>;
};

const useEnvStore = create<EnvState>()(
  immer((set, get) => ({
    SystemEnv: {}, // env_storage_className: '',
    // migrate_file_image: '',
    // minio_url: ''
    initSystemEnv: async () => {
      const data = await getSystemEnv();
      set((state) => {
        state.SystemEnv = data;
      });
      return data;
    }
  }))
);

export default useEnvStore;
