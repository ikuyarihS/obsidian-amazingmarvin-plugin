import { MarkdownPostProcessorContext } from 'obsidian';
import { Category, Query, Task } from './@types';
import utils from './utils';

const base = 'https://serv.amazingmarvin.com/api';

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
    if (!response.ok) return;
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
    return results as Category[];
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
    const [tasks, categories] = await Promise.all([this.get(api), this.getCategories()]);
    if (!tasks) return;
    const categoriesMap: Record<string, Category> = categories.reduce(
      (map, category) => ({ ...map, [category._id]: category }),
      {}
    );
    const unassigned: Task[] = [];
    tasks.forEach((task: Task) => {
      if (task.parentId in categoriesMap) {
        categoriesMap[task.parentId].tasks = categoriesMap[task.parentId].tasks || [];
        categoriesMap[task.parentId].tasks.push(task);
      } else {
        unassigned.push(task);
      }
    });
    const categoriesTree = utils.toTree(categories);
    el.innerText = '';

    const container = el.createDiv();
    container.className = 'amazing-marvin-container';

    container.createEl('p', { text: query.title || query.type || 'Tasks' });

    const ul = container.createEl('ul');
    const items = [...categoriesTree, ...unassigned];
    this._renderTasks(ul, items, query);
  }

  /**
   * @private
   * @param {HTMLElement} el
   * @param {(Task | Category)[]} items
   * @param {Query} query
   * @memberof AmazingMarvinApi
   */
  _renderTasks(el: HTMLElement, items: any[], query: Query): void {
    items.forEach(item => {
      const listItem = el.createEl('li');
      listItem.appendChild(utils.convertHyperlinks(item.title));
      let note;
      if (query.showNote && item.note && (note = utils.getNote(item.note))) {
        const blockquote = listItem.createEl('blockquote');
        blockquote.appendChild(utils.convertHyperlinks(note));
        listItem.appendChild(blockquote);
      }
      const children = item.children?.length > 0 ? item.children : item.tasks;
      if (children?.length > 0) {
        const innerUl = listItem.createEl('ul');
        this._renderTasks(innerUl, children, query);
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
        const query = JSON.parse(node.innerText) as Query;
        el.innerText = 'Fetching data from Amazing Marvin ...';
        switch (query.type) {
          case 'today':
            await this.renderTasks(el, query, 'todayItems');
            break;
          case 'due-today':
            await this.renderTasks(el, query, 'dueItems');
            break;
          default:
            el.innerText = '[Amazing Marvin Plugin] Unknown config';
            break;
        }
      } catch (err) {
        el.style.color = 'red';
        if (err instanceof SyntaxError) el.innerText = '[Amazing Marvin Plugin] Syntax Error! Invalid JSON!';
        else el.innerText = `[Amazing Marvin Plugin] Unhandled error - ${err}`;
      }
    })();
  }
}

export default AmazingMarvinApi;
