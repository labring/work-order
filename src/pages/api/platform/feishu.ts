import { verifyAccessToken } from '@/services/backend/auth';
import { jsonRes } from '@/services/backend/response';
import { ApiResp } from '@/services/kubernet';
import { FeishuNotification } from '@/services/platform/feishu';
import { WorkOrderType } from '@/types/workorder';
import type { NextApiRequest, NextApiResponse } from 'next';

export type FeishuNotificationParams = {
  type: WorkOrderType;
  description: string;
  orderId: string;
  switchToManual?: boolean;
  subscription: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResp>) {
  try {
    const {
      type,
      description,
      orderId,
      switchToManual = false,
      subscription
    } = req.body as FeishuNotificationParams;

    const payload = await verifyAccessToken(req);
    if (!payload) {
      return jsonRes(res, {
        code: 401,
        message: "'token is invaild'"
      });
    }
    const result = await FeishuNotification({
      type,
      description,
      orderId,
      switchToManual,
      subscription,
      payload
    });
    jsonRes(res, { data: result });
  } catch (error) {
    console.log(error);
    jsonRes(res, {
      code: 500,
      error
    });
  }
}
