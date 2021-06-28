import { HYPERLINK_REGEX, INHERIT_PROPS } from './constants';

export const convertHyperlinks = (rawText: string): HTMLSpanElement => {
  const element = document.createElement('span');
  let match;
  let index = 0;
  while ((match = HYPERLINK_REGEX.exec(rawText))) {
    const [_, text, href] = [...match];
    element.appendText(rawText.substring(index, match.index));
    index = match.index;
    element.createEl('a', { text: text, href: href });
  }
  if (index === 0) element.appendText(rawText);
  return element;
};

export const getNote = (note: string | any[]): string | undefined => {
  let nodes;
  if (typeof note === 'string') nodes = JSON.parse(note.substr(note.indexOf('{')))?.document?.nodes as any[];
  else nodes = note;
  return getTextFromNodes(nodes);
};

export const getTextFromNodes = (nodes: any[]): string | undefined => {
  const results = nodes
    .map((node: any) => {
      if (node.object === 'leaf' && node.text) return node.text;
      else if (node.leaves || node.nodes) return getTextFromNodes(node.leaves || node.nodes);
    })
    .filter((node: any) => node)
    .join('\n');
  return results || undefined;
};

export const toTree = (data: any[]): any[] => {
  const map: any = data.reduce((obj, item) => ({ ...obj, [item._id]: item }), {});

  const tree: any[] = [];
  data.forEach(item => {
    if (item.parentId in map) {
      map[item.parentId].children = map[item.parentId].children || [];
      map[item.parentId].children.push(item);
    } else {
      tree.push(item);
    }
  });

  return tree;
};

export const inherit = (items: any[], props: string[]): void => {
  items.forEach(item => props.forEach(prop => INHERIT_PROPS.forEach(_prop => _inherit(prop, item, item[_prop]))));
};

const _inherit = (prop: string, parent: any, children: any[]) => {
  if (!children || children.constructor !== Array) return;
  children.forEach(child => {
    if (parent.hasOwnProperty(prop) && !child[prop]) child[prop] = parent[prop];
    INHERIT_PROPS.forEach(_prop => _inherit(prop, child, child[_prop]));
  });
};

export const hideEmpty = (items: any[]): any[] => {
  const filtered = items.filter(item => {
    if (item.children) item.children = hideEmpty(item.children);
    if (!item.children) delete item.children;
    return !isEmpty(item);
  });
  return filtered;
};

const isEmpty = (item: any): boolean => {
  if (item.db === 'Tasks') return false;
  if (item.tasks?.length > 0) return false;
  return (item.children || []).every((child: any) => isEmpty(child));
};
