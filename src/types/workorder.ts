import { ObjectId } from 'mongodb';
import { UserDB } from './user';

export type WorkOrderDB = {
  _id?: ObjectId; // only
  userId: string; // only
  orderId: string; // only
  type: WorkOrderType;
  createTime: Date;
  updateTime: Date;
  completeTime?: Date;
  description: string;
  status: WorkOrderStatus;
  dialogs?: WorkOrderDialog[];
  appendix?: string[];
  manualHandling: {
    isManuallyHandled: boolean;
    handlingTime?: Date;
  };
  userInfo: UserDB;
  closedBy?: string;
  deletedBy?: string;
};

export type WorkOrderDialog = {
  time: Date;
  content: string;
  userId: string;
  isAdmin: boolean;
  isAIBot: boolean;
  isRecall?: boolean;
};

export enum WorkOrderType {
  All = 'all', // 全部
  App = 'app', // 应用
  Dataset = 'dataset', // 知识库
  Account = 'account', // 账户
  Commercial = 'commercial', // 商业版
  Other = 'other' // 其他
}

export type WorkOrderEditForm = {
  type: WorkOrderType;
  description: string;
};

export enum WorkOrderStatus {
  All = 'all',
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Deleted = 'deleted'
}
