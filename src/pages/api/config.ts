import type { NextApiRequest, NextApiResponse } from 'next';

// get config
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const config = globalThis.SystemConfig;
  console.log(config);
}
