import type { MarkdownPostProcessorContext } from 'obsidian';
import type { Category, Label, Query, Task } from './@types';
import AmazingMarvinTasks from './ui/AmazingMarvinTasks.svelte';
import ErrorDisplay from './ui/ErrorDisplay.svelte';
import { hideEmpty, inherit, toTree } from './utils';
import { DEFAULT_QUERY } from './utils/constants';

const base = 'https://serv.amazingmarvin.com/api';

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
    data
      .filter((item: Task | Category) => item.hasOwnProperty('subtasks'))
      .forEach((item: Task) => (item.subtasks = Object.values(item.subtasks)));

    switch (dataType?.toLowerCase()) {
      case 'task':
      case 'tasks':
        data = this.getTasks(data);
        break;
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
   * @private
   * @param {Query} query
   * @param {string} api
   * @return {Promise<any[]>}
   * @memberof AmazingMarvinApi
   */
  public async getData(query: Query, api: string): Promise<any[]> {
    let getLabelsTask = undefined;
    if (query.showLabel) getLabelsTask = this.get('labels');
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
    let items = [...categoriesTree, ...unassignedTasks];
    if (query.hideEmpty) items = hideEmpty(items);
    if (query.inheritColor) inherit(items, ['color']);

    let labels = [];
    if (getLabelsTask) {
      try {
        labels = await getLabelsTask;
      } catch (e) {
        console.log('Got error when getting labels, however we will ignore this one to let the plugin continue.');
      }
    }

    const labelsMap = labels.reduce((map: Record<string, Label>, label: Label) => ({ ...map, [label._id]: label }), {});
    return [items, labelsMap];
  }

  /**
   * @param {HTMLElement} el
   * @param {Query} query
   * @return {Promise<void>}
   * @memberof AmazingMarvinApi
   */
  async renderTasks(el: HTMLElement, query: Query): Promise<void> {
    el.innerText = '';
    const getData = this.getData.bind(this);
    new AmazingMarvinTasks({
      target: el,
      props: {
        query: query,
        getData: getData,
        api: this.getApiFromType(query.type),
      },
    });
  }

  /**
   * @param {('today' | 'due-today')} type
   * @return {(string | undefined)}
   */
  getApiFromType = (type: 'today' | 'due-today'): string | undefined => {
    switch (type) {
      case 'today':
        return 'todayItems';
      case 'due-today':
        return 'dueItems';
      default:
        throw new Error('No type specified');
    }
  };

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
        await this.renderTasks(el, query);
      } catch (err) {
        new ErrorDisplay({ target: el, props: { error: err } });
        throw err;
      }
    })();
  }
}

export default AmazingMarvinApi;
