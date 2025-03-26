export interface Task {
  id: string;
  senderAddress: string;
  receiverAddress: string;
  deliveryDate: string;
  remainingTime: number;
  carrier: string;
  status: TaskStatus;
  createdAt: string;
}

export enum TaskStatus {
  IN_PROGRESS = 'В пути',
  DELIVERED = 'Доставлен',
  OVERDUE = 'Просрочено'
}