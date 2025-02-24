import { verifyAccessToken } from '@/services/backend/auth';
import { jsonRes } from '@/services/backend/response';
import { updateUser } from '@/services/db/user';
import { ApiResp } from '@/services/kubernet';
import { NextApiRequest, NextApiResponse } from 'next/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResp>) {
  const { userId, username } = req.body;
  const payload = await verifyAccessToken(req);
  if (!payload) {
    return jsonRes(res, {
      code: 401,
      message: "'token is invaild'"
    });
  }
  if (!payload.isAdmin) {
    return jsonRes(res, {
      code: 401,
      message: 'unauthorized'
    });
  }
  await updateUser(userId, username, {
    isAdmin: true
  });
  return jsonRes(res, {
    code: 200,
    message: 'success'
  });
}
