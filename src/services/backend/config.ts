import { readFileSync } from 'fs';

export type ConfigType = {
  title: {
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
      try {
        return readFileSync(filePath, 'utf-8');
      } catch (error) {
        console.log(error);
      }
    }
    throw new Error('config file not found');
  })();

  globalThis.SystemConfig = JSON.parse(content) as ConfigType;
  return globalThis.SystemConfig;
};
