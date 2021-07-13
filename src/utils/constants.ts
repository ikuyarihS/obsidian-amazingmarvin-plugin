import type { PluginSettings, Query } from '../@types/index';

export const HYPERLINK_REGEX = /\[(?<text>[^\]]+?)\]\((?<href>https?:\S+?)\)/g;

export const INHERIT_PROPS = ['children', 'tasks', 'subtasks'];

export const DEFAULT_QUERY: Query = {
  colorTitle: true,
  showNote: false,
  hideEmpty: true,
  inheritColor: true,
  showLabel: true,
  isAnimated: true,
};

export const DEFAULT_APP_SETTINGS: PluginSettings = {
  apiToken: '',
  fullAccessToken: '',
  showRibbon: true,
  ribbonQuery: {
    title: '',
    type: 'due-today',
    hideEmpty: true,
    showLabel: true,
    showNote: false,
    isAnimated: true,
    colorTitle: true,
    inheritColor: true,
  },
};

export const EMOJIS: { [key: string]: string } = {
  category: '📁',
  project: '🏳️',
  inbox: '📥',
};
