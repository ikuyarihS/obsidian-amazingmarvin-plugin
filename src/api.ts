import { MarkdownPostProcessorContext } from 'obsidian';
import { Category, Query, Task } from './@types';
import { convertHyperlinks, getNote, hideEmpty, inherit, toTree } from './utils';
import { CATEGORY_ICON, INBOX_ICON, PROJECT_ICON } from './utils/icons';

const base = 'https://serv.amazingmarvin.com/api';

const ICONS: Record<string, Element> = {
  category: CATEGORY_ICON,
  project: PROJECT_ICON,
  inbox: INBOX_ICON,
};

const DEFAULT_QUERY: Query = {
  colorTitle: true,
  showNote: false,
  hideEmpty: true,
  inheritColor: true,
};

const INBOX_CATEGORY = { _id: 'unassigned', title: 'Inbox', type: 'inbox', children: [], tasks: [] } as Category;

/**
 * @class AmazingMarvinApi
 */
class AmazingMarvinApi {
  apiToken: string;

  /**
   * Creates an instance of AmazingMarvinApi.
   * @param {string} [apiToken='']
   * @memberof AmazingMarvinApi
   */
  constructor(apiToken = '') {
    this.apiToken = apiToken;
  }

  /**
   * Change the current apiToken
   * @param {string} apiToken
   * @memberof AmazingMarvinApi
   */
  changeToken(apiToken: string): void {
    this.apiToken = apiToken;
  }

  /**
   * @param {string} api
   * @param {string} [dataType='Tasks']
   * @return {(Promise<any | undefined>)}
   * @memberof AmazingMarvinApi
   */
  async get(api: string, dataType?: string): Promise<any | undefined> {
    const response = await fetch(`${base}/${api}`, {
      method: 'GET',
      headers: {
        'X-API-Token': this.apiToken,
      },
    });
    if (!response.ok) throw new Error('wrong apiToken or api url');
    let data = await response.json();

    switch (dataType?.toLowerCase()) {
      case 'task':
      case 'tasks':
        data = this.getTasks(data);
      default:
        break;
    }
    return data;
  }

  /**
   * @return {any[]}
   * @memberof AmazingMarvinApi
   */
  async getCategories(): Promise<Category[]> {
    const results = await this.get('categories');
    return [{ ...INBOX_CATEGORY, children: [], tasks: [] }, ...results] as Category[];
  }

  /**
   * @private
   * @param {any[]} results
   * @return {Task[]}
   * @memberof AmazingMarvinApi
   */
  private getTasks = (results: any[]): Task[] => {
    return results.filter(result => result.db === 'Tasks');
  };

  /**
   * @param {HTMLElement} el
   * @param {Query} query
   * @param {string} api
   * @return {Promise<void>}
   * @memberof AmazingMarvinApi
   */
  async renderTasks(el: HTMLElement, query: Query, api: string): Promise<void> {
    const [tasks, categories] = await Promise.all([this.get(api, 'Tasks'), this.getCategories()]);
    if (!tasks) return;
    const categoriesMap: Record<string, Category> = categories.reduce(
      (map, category) => ({ ...map, [category._id]: category }),
      {}
    );
    const unassignedTasks: any[] = [];
    tasks.forEach((task: Task) => {
      if (task.parentId in categoriesMap) {
        categoriesMap[task.parentId].tasks = categoriesMap[task.parentId].tasks || [];
        categoriesMap[task.parentId].tasks.push(task);
      } else {
        unassignedTasks.push(task);
      }
    });
    const categoriesTree = toTree(categories);
    el.innerText = '';

    const container = el.createDiv();
    container.className = 'amazing-marvin-container';

    container.createEl('h3', { text: query.title || query.type || 'Tasks' });

    const ul = container.createEl('ul');
    let items = [...categoriesTree, ...unassignedTasks];
    if (query.hideEmpty) items = hideEmpty(items);
    if (query.inheritColor) inherit(items, ['color']);
    this._render(ul, items, query);
  }

  /**
   * @private
   * @param {HTMLElement} el
   * @param {(Task | Category)[]} items
   * @param {Query} query
   * @memberof AmazingMarvinApi
   */
  _render(el: HTMLElement, items: any[], query: Query): void {
    items.forEach(item => {
      const listItem = el.createEl('li');

      // Add icon to Category and Project
      if (item.type) {
        const icon = ICONS[item.type].cloneNode(true) as HTMLElement;
        icon.style.marginRight = '5px';
        if (item.color) icon.style.color = item.color;
        listItem.appendChild(icon);
      }

      // Get title and add color
      const title = convertHyperlinks(item.title);
      if (query.colorTitle && item.color) title.style.color = item.color;

      listItem.appendChild(title);

      // Note is a nested objects, hence the complication
      let note;
      if (query.showNote && item.note && (note = getNote(item.note))) {
        const blockquote = listItem.createEl('blockquote');
        const noteElement = convertHyperlinks(note);
        blockquote.appendChild(noteElement);
        listItem.appendChild(blockquote);
      }

      if (item.children?.length > 0) {
        const innerUl = listItem.createEl('ul');
        this._render(innerUl, item.children, query);
      }

      if (item.tasks?.length > 0) {
        const innerUl = listItem.createEl('ul');
        this._render(innerUl, item.tasks, query);
      }
    });
  }

  /**
   * @param {HTMLElement} el
   * @param {MarkdownPostProcessorContext} ctx
   * @return {void}
   * @memberof AmazingMarvinApi
   */
  parseCodeblock(el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
    (async () => {
      const node = el.querySelector<HTMLPreElement>('code[class*="language-amazingmarvin"]');
      if (!node) return;
      try {
        const query = Object.assign({}, DEFAULT_QUERY, JSON.parse(node.innerText)) as Query;
        el.innerText = 'Fetching data from Amazing Marvin ...';
        switch (query.type) {
          case 'today':
            await this.renderTasks(el, query, 'todayItems');
            break;
          case 'due-today':
            await this.renderTasks(el, query, 'dueItems');
            break;
          default:
            el.style.color = 'red';
            el.innerText = '[Amazing Marvin Plugin] Unknown config';
            break;
        }
      } catch (err) {
        console.log(err);
        el.style.color = 'red';
        if (err instanceof SyntaxError) el.innerText = `[Amazing Marvin Plugin] Invalid JSON - ${err}`;
        else el.innerText = `[Amazing Marvin Plugin] Unhandled error - ${err}`;
      }
    })();
  }
}

export default AmazingMarvinApi;
