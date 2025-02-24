'use client';
import { readFileSync } from 'fs';

export type ConfigType = {
  title: string;
  workorder: {
    type: {
      id: string;
      label: string;
    }[];
  };
  user: {
    level: {
      id: string;
      label: string;
      priority: number;
    }[];
  };
};

export const initConfig = () => {
  if (globalThis.SystemConfig) return globalThis.SystemConfig;
  const content = readFileSync('config.local.json', 'utf8');
  globalThis.SystemConfig = JSON.parse(content) as ConfigType;
  return globalThis.SystemConfig;
};
