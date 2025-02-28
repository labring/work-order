import { verifyAdmin } from '@/services/backend/auth';
import { jsonRes } from '@/services/backend/response';
import { updateUser } from '@/services/db/user';
import { ApiResp } from '@/services/kubernet';
import { NextApiRequest, NextApiResponse } from 'next/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResp>) {
  const { userId, username } = req.body;
  try {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
      return jsonRes(res, {
        code: 401,
        message: "'token is invaild'"
      });
    }
  } catch (error) {
    return jsonRes(res, {
      code: 401,
      message: "'token is invaild'"
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
