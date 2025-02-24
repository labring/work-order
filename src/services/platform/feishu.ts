import { WorkOrderType } from '@/types/workorder';
import { updateOrder } from '../db/workorder';
import { TokenPayload } from '@/types/user';

export type FeishuNotificationParams = {
  type: WorkOrderType;
  description: string;
  orderId: string;
  switchToManual?: boolean;
  subscription: string;
  payload: TokenPayload;
};

export const FeishuNotification = async ({
  type,
  description,
  orderId,
  switchToManual = false,
  subscription,
  payload
}: FeishuNotificationParams) => {
  const feishuUrl = process.env.ADMIN_FEISHU_URL;
  const feishuCallBackUrl = process.env.ADMIN_FEISHU_CALLBACK_URL;
  if (!feishuUrl) {
    return {};
  }
  const header = switchToManual
    ? {
        template: (() => {
          switch (subscription) {
            case 'free':
              return 'blue';
            case 'experience':
              return 'green';
            case 'team':
              return 'purple';
            case 'enterprise':
              return 'red';
            case 'custom':
              return 'turquoise';
          }
        })(),
        title: {
          content: `请求人工处理`,
          tag: 'plain_text'
        },
        subtitle: {
          content: `工单ID: ${orderId}`,
          tag: 'plain_text'
        },
        text_tag_list: [
          {
            tag: 'text_tag',
            text: {
              // 标签内容
              tag: 'plain_text',
              content: subscription
            },
            color: 'neutral' // 标签颜色
          }
        ]
      }
    : {
        template: 'turquoise',
        title: {
          content: `有新的工单`,
          tag: 'plain_text'
        },
        subtitle: {
          content: `工单ID: ${orderId}`,
          tag: 'plain_text'
        }
      };

  if (switchToManual) {
    await updateOrder({
      orderId,
      userId: payload.userId,
      updates: {
        manualHandling: { isManuallyHandled: true }
      }
    });
  }

  const form = {
    msg_type: 'interactive',
    card: {
      elements: [
        {
          tag: 'markdown',
          content: `**用户ID:** ${payload.userId}\n**Domain:** ${payload.domain}\n所属分类: ${type}\n描述信息: ${description}\n订阅级别: ${subscription}`
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: '查看详情'
              },
              type: 'primary',
              multi_url: {
                url: feishuCallBackUrl + `/workorder/detail?orderId=${orderId}`,
                android_url: '',
                ios_url: '',
                pc_url: ''
              }
            }
          ]
        }
      ],
      header
    }
  };

  const data = await fetch(feishuUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(form)
  });
  return await data.json();
};
