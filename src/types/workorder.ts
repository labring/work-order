import { ObjectId } from 'mongodb';
import { UserDB } from './user';

export type WorkOrderDB = {
  _id?: ObjectId; // only
  userId: string; // only
  orderId: string; // only
  type: string;
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

export type WorkOrderEditForm = {
  type: string;
  description: string;
};

export enum WorkOrderStatus {
  All = 'all',
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Deleted = 'deleted'
}
