export interface AmazingMarvin {
  type: string;
}

export interface AmazingMarvinPluginSettings {
  apiToken: string;
  fullAccessToken: string;
}

export interface AmazingMarvinTask {
  _id: string;
  _rev: string;
  createdAt: number;
  title: string;
  parentId: string;
  onboard: boolean;
  day: string;
  done: boolean;
  rank: number;
  note: string;
  timeEstimate: number;
  db: string;
  firstScheduled: string;
  updatedAt: number;
  dueDate: string;
  fieldUpdates: FieldUpdates;
}

interface FieldUpdates {
  dueDate: number;
}

export interface Query {
  type?: string;
}
