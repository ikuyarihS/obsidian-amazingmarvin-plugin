import type { Plugin } from 'obsidian';
import type AmazingMarvinApi from '../api';
import type FileManager from '../fileManager';
import type { LeafView } from '../leaf';

export const LeafViewType = 'amazing-marvin-leaf';

export interface AmazingMarvinPlugin extends Plugin {
  settings: PluginSettings;
  amazingMarvinApi: AmazingMarvinApi;
  fileManager: FileManager;
  ribbon: HTMLElement;
  leafView: LeafView;

  saveSettings: () => Promise<void>;
  showRibbon: (value: boolean) => void;
}

export interface PluginSettings {
  apiToken: string;
  fullAccessToken: string;
  showRibbon: boolean;
  ribbonQuery: Query;
}

export interface Query {
  title?: string;
  type?: 'today' | 'due-today';
  showNote?: boolean;
  colorTitle: boolean;
  hideEmpty: boolean;
  inheritColor: boolean;
  showLabel: boolean;
  isAnimated: boolean;
}

export interface Task {
  _id: string;
  _rev: string;
  createdAt: number;
  title: string;
  parentId: string;
  onboard: boolean;
  day: string;
  done: boolean;
  rank: number;
  note: string | null;
  timeEstimate: number;
  db: string;
  firstScheduled: string;
  updatedAt: number;
  dueDate: string;
  fieldUpdates: FieldUpdates;
  children: Task[];
  color?: string;
  labelIds?: string[];
  subtasks?: Record<string, Subtask> | Subtask[];
}

export interface Subtask {
  _id: string;
  title: string;
  done: boolean;
  rank: number;
}

interface FieldUpdates {
  dueDate: number;
}

export interface Category {
  _id: string;
  type: string;
  title: string;
  color?: string;
  parentId: string;
  day?: any;
  firstScheduled: string;
  dueDate: string;
  labelIds: string[];
  priority?: any;
  children?: Category[];
  tasks: Task[];
}

export interface Label {
  _id: string;
  title: string;
  color: string;
}

export interface Item {
  [key: string]: any;
  type?: string;
  color?: string;
  labelIds?: string[];
  note?: string;
}
