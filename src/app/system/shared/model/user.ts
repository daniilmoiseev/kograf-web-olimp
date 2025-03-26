import {Task} from "./task";

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  tasks?: Task[];
}

export enum UserRole {
  LOGIST = 'Логист',
  CARRIER = 'Перевозчик'
}
