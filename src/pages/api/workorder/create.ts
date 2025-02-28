import { verifyToken } from '@/services/backend/auth';
import { jsonRes } from '@/services/backend/response';
import { createOrder } from '@/services/db/workorder';
import { FeishuNotification } from '@/services/platform/feishu';
import { WorkOrderDB, WorkOrderStatus } from '@/types/workorder';
import { customAlphabet } from 'nanoid';
import { NextApiRequest, NextApiResponse } from 'next';
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 12);

export type CreateWorkOrderParams = {
  type: string;
  description: string;
  files?: string[];
  appendix?: string[];
  token: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { type, description, appendix, token, files } = req.body as CreateWorkOrderParams;
    const userInfo = await verifyToken(token);
    if (!userInfo) {
      return jsonRes(res, {
        code: 401,
        message: "'token is invaild'"
      });
    }

    const workorder: WorkOrderDB = {
      userId: userInfo.userId,
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
        level: userInfo.level
      },
      dialogs: [
        ...(files
          ? files.map((file) => ({
              isAdmin: false,
              isAIBot: false,
              userId: userInfo.userId,
              content: file,
              time: new Date()
            }))
          : []),
        {
          isAdmin: false,
          isAIBot: false,
          userId: userInfo.userId,
          content: description,
          time: new Date()
        }
      ]
    };

    await createOrder({ order: workorder });
    await FeishuNotification({
      type: workorder.type,
      description: workorder.description,
      orderId: workorder.orderId,
      level: userInfo.level,
      switchToManual: false,
      payload: {
        userId: userInfo.userId,
        domain: userInfo.domain
      }
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
