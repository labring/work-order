import { updateOrder } from '../db/workorder';

export type FeishuNotificationParams = {
  type: string;
  description: string;
  orderId: string;
  switchToManual?: boolean;
  payload: {
    userId: string;
    domain: string;
  };
  level: number;
};

export const FeishuNotification = async ({
  type,
  description,
  orderId,
  switchToManual = false,
  level,
  payload
}: FeishuNotificationParams) => {
  const feishuUrl = process.env.ADMIN_FEISHU_URL;
  const feishuCallBackUrl = process.env.ADMIN_FEISHU_CALLBACK_URL;
  const subscription = global.SystemConfig.userlevel[level].label.zh;
  if (!feishuUrl) {
    return {};
  }
  const header = {
    ...(switchToManual
      ? {
          template: (() => {
            switch (level) {
              case 0: // free
                return 'blue';
              case 1: // exprience
                return 'green';
              case 2: // team
                return 'purple';
              case 3: // enterprice
                return 'red';
              case 4: // custom
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
          }
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
        }),
    text_tag_list: [
      {
        tag: 'text_tag',
        text: {
          // 标签内容
          tag: 'plain_text',
          content: `用户等级: ${subscription}`
        },
        color: 'neutral' // 标签颜色
      }
    ]
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
          content: `**用户ID:** ${payload.userId}\n**Domain:** ${payload.domain}\n**所属分类**: ${type}\n**描述信息**: ${description}`
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
