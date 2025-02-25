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

export const initConfig = () => {
  if (globalThis.SystemConfig) return globalThis.SystemConfig;
  const content = readFileSync('config.local.json', 'utf8');
  globalThis.SystemConfig = JSON.parse(content) as ConfigType;
  return globalThis.SystemConfig;
};
