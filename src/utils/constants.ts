import { Query } from '../@types/index';

export const HYPERLINK_REGEX = /\[(?<text>[^\]]+?)\]\((?<href>https?:\S+?)\)/g;

export const INHERIT_PROPS = ['children', 'tasks', 'subtasks'];

export const DEFAULT_QUERY: Query = {
  colorTitle: true,
  showNote: false,
  hideEmpty: true,
  inheritColor: true,
  showLabel: true,
};
