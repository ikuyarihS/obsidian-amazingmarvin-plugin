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
  activeControllers: Record<string, AbortController | null> = {};

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
    // Add timeout to prevent hanging fetches from blocking the plugin
    // Also abort any in-flight request for the same API to avoid queueing and blocking
    if (this.activeControllers[api]) {
      try {
        this.activeControllers[api]?.abort();
      } catch (e) {
        // ignore
      }
      this.activeControllers[api] = null;
    }
    const controller = new AbortController();
    this.activeControllers[api] = controller;
    const timeoutMs = 15000; // 15 seconds
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(`${base}/${api}`, {
        method: 'GET',
        headers: {
          'X-API-Token': this.apiToken,
        },
        signal: controller.signal,
      });
    } catch (e) {
      // Map abort to a friendly error and rethrow
      if ((e as any)?.name === 'AbortError') {
        throw new Error('Request aborted due to timeout');
      }
      throw e;
    } finally {
      clearTimeout(timeout);
      // clear this request's controller so subsequent requests can run
      if (this.activeControllers[api] === controller) this.activeControllers[api] = null;
    }
    if (!response.ok) throw new Error('wrong apiToken or api url');
    try {
      // Try to parse response as JSON
      const debugData = await response.clone().json().catch(() => null as any);
      console.debug(`[AmazingMarvinApi] GET ${api} => ok (preview: ${JSON.stringify(debugData ? (Array.isArray(debugData) ? debugData?.length : 'object') : 'not json')})`);
    } catch (e) {
      /* ignore debug logging failures */
    }
    let data = await response.json();
    // Normalize subtasks: convert object maps to arrays and handle null/undefined safely
    data.forEach((item: Task | Category) => {
      // Narrow to Task via 'subtasks' in item check
      if (!Object.prototype.hasOwnProperty.call(item, 'subtasks')) return;
      const task = item as Task;
      // If subtasks is null or undefined, set to empty array
      if (!task.subtasks) {
        task.subtasks = [] as any;
        return;
      }
      // If it's already an array, keep it
      if (Array.isArray(task.subtasks)) return;
      // If it's an object (map), extract values
      task.subtasks = Object.values(task.subtasks as Record<string, any>) as any;
    });

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

      // In Live Preview the context includes an editor. We should avoid rendering if the
      // cursor is currently inside the code block so the author can edit the block comfortably.
      const isLivePreview = !!(ctx as any).editor;
      let shouldRender = true;
      if (isLivePreview) {
        try {
          const editor = (ctx as any).editor as any;
          const sectionInfo = (ctx as any).getSectionInfo?.(node) as any;
          const cursor = editor?.getCursor?.();
          // Find numeric start/end lines if available
          const startLine = sectionInfo?.lineStart ?? sectionInfo?.firstLine ?? sectionInfo?.from?.line ?? sectionInfo?.start?.line ?? sectionInfo?.start;
          const endLine = sectionInfo?.lineEnd ?? sectionInfo?.lastLine ?? sectionInfo?.to?.line ?? sectionInfo?.end?.line ?? sectionInfo?.end;
          if (typeof startLine === 'number' && typeof endLine === 'number' && cursor && typeof cursor.line === 'number') {
            // Only render if the cursor is NOT inside the code block
            shouldRender = !(cursor.line >= startLine && cursor.line <= endLine);
          } else {
            // If we don't have a cursor or section info, be conservative and avoid rendering in Live Preview
            shouldRender = false;
          }
        } catch (e) {
          // On any error, avoid rendering in Live Preview to avoid interfering with editing
          shouldRender = false;
        }
      }

      if (!shouldRender) return;

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
