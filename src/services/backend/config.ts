import { existsSync, readFileSync } from 'fs';

export type ConfigType = {
  title: {
    en: string;
    zh: string;
  };
  adminName: {
    en: string;
    zh: string;
  };
  workorder: {
    type: {
      id: string;
      label: {
        en: string;
        zh: string;
      };
    }[];
  };
  userlevel: {
    label: {
      en: string;
      zh: string;
    };
  }[];
};

const filePathList = ['config.json', 'config.local.json'];

export const initConfig = () => {
  if (globalThis.SystemConfig) return globalThis.SystemConfig;
  const content = (() => {
    for (const filePath of filePathList) {
      if (existsSync(filePath)) return readFileSync(filePath);
    }
    throw new Error('config file not found');
  })();

  if (!content) {
    return Promise.reject(new Error('config file not found'));
  }

  globalThis.SystemConfig = JSON.parse(content.toString()) as ConfigType;
  return globalThis.SystemConfig;
};
