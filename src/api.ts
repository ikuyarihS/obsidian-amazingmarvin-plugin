import { MarkdownPostProcessorContext } from 'obsidian';
import { AmazingMarvinTask, Query } from './@types';
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
  private async get(api: string, dataType = 'Tasks'): Promise<any | undefined> {
    const response = await fetch(`${base}/${api}`, {
      method: 'GET',
      headers: {
        'X-API-Token': this.apiToken,
      },
    });
    if (!response.ok) return;
    const results = await response.json();
    console.log(results);

    if (dataType) {
      switch (dataType.toLowerCase()) {
        case 'task':
        case 'tasks':
          return this.getTasks(results);
        default:
          return results;
      }
    }
  }

  /**
   * @private
   * @param {any[]} results
   * @return {AmazingMarvinTask[]}
   * @memberof AmazingMarvinApi
   */
  private getTasks = (results: any[]): AmazingMarvinTask[] => {
    return results.filter(result => result.db === 'Tasks');
  };

  /**
   * @param {HTMLElement} el
   * @memberof AmazingMarvinApi
   */
  async renderTodayTasks(el: HTMLElement): Promise<void> {
    let tasks;
    if (!(tasks = await this.get('todayItems'))) return;
    el.innerText = '';

    const container = el.createDiv();
    container.className = 'amazing-marvin-container';

    container.createEl('p', { text: 'Scheduled for today:' });

    const ul = container.createEl('ul');
    tasks.forEach((task: AmazingMarvinTask) => {
      const item = ul.createEl('li');
      item.appendChild(utils.convertHyperlinks(task.title));
    });
  }

  /**
   * @param {HTMLElement} el
   * @memberof AmazingMarvinApi
   */
  async renderDueTodayTasks(el: HTMLElement): Promise<void> {
    let tasks;
    if (!(tasks = await this.get('dueItems'))) return;
    el.innerText = '';

    const container = el.createDiv();

    container.className = 'amazing-marvin-container';

    container.createEl('p', { text: 'Due today:' });

    const ul = container.createEl('ul');
    tasks.forEach((task: AmazingMarvinTask) => {
      const item = ul.createEl('li');
      item.appendChild(utils.convertHyperlinks(task.title));
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
            await this.renderTodayTasks(el);
            break;
          case 'due-today':
            await this.renderDueTodayTasks(el);
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
