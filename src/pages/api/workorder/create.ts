import { verifyAccessToken, verifyToken } from '@/services/backend/auth';
import { jsonRes } from '@/services/backend/response';
import { createOrder } from '@/services/db/workorder';
import { FeishuNotification } from '@/services/platform/feishu';
import { subscriptionMap } from '@/types/user';
import { WorkOrderDB, WorkOrderStatus, WorkOrderType } from '@/types/workorder';
import { customAlphabet } from 'nanoid';
import { NextApiRequest, NextApiResponse } from 'next';
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 12);

export type CreateWorkOrderParams = {
  type: WorkOrderType;
  description: string;
  appendix?: string[];
  token: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { type, description, appendix, token } = req.body as CreateWorkOrderParams;
    const payload = await verifyAccessToken(req);
    const userInfo = await verifyToken(token);
    if (!payload || !userInfo) {
      return jsonRes(res, {
        code: 401,
        message: "'token is invaild'"
      });
    }

    const workorder: WorkOrderDB = {
      userId: payload.userId,
      orderId: nanoid(),
      type,
      updateTime: new Date(),
      createTime: new Date(),
      description,
      status: WorkOrderStatus.Pending,
      appendix,
      manualHandling: {
        isManuallyHandled: false
      },
      userInfo: {
        username: userInfo.username,
        teamId: userInfo.teamId,
        userId: userInfo.userId,
        isAdmin: userInfo.isAdmin,
        domain: userInfo.domain,
        subscription: subscriptionMap[userInfo.subscription as keyof typeof subscriptionMap] ?? 0
      }
    };

    await createOrder({ order: workorder });
    await FeishuNotification({
      type: workorder.type,
      description: workorder.description,
      orderId: workorder.orderId,
      subscription: userInfo.subscription,
      switchToManual: false,
      payload: userInfo
    });

    jsonRes(res, {
      data: {
        orderId: workorder.orderId
      }
    });
  } catch (error) {
    console.log(error);
    jsonRes(res, { code: 500, data: error });
  }
}
