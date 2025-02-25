import { type ApiRequestProps, type ApiResponseType, NextAPI } from '@/services/api';
import { type ConfigType, initConfig } from '@/services/backend/config';

export type SystemEnvResponse = {
  domain?: string;
  config: ConfigType;
};

async function handler(req: ApiRequestProps, res: ApiResponseType<SystemEnvResponse>) {
  const config = initConfig();
  return {
    domain: process.env.DOMAIN,
    config
  };
}

export default NextAPI(handler);
