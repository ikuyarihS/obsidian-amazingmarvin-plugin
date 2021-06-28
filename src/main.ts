import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import type { PluginSettings } from './@types/index';
import AmazingMarvinApi from './api';

const DEFAULT_APP_SETTINGS: PluginSettings = {
  apiToken: '',
  fullAccessToken: '',
};

/**
 * @export
 * @class AmazingMarvinPlugin
 * @extends {Plugin}
 */
export default class AmazingMarvinPlugin extends Plugin {
  settings: PluginSettings;
  amazingMarvinApi: AmazingMarvinApi;

  /**
   * @memberof AmazingMarvinPlugin
   */
  async onload(): Promise<void> {
    await this.loadSettings();
    this.amazingMarvinApi = new AmazingMarvinApi(this.settings.apiToken);

    this.registerMarkdownPostProcessor(this.amazingMarvinApi.parseCodeblock.bind(this.amazingMarvinApi));
    this.addSettingTab(new SettingTab(this.app, this));

    console.log('Amazing Marvin plugin loaded');
  }

  /**
   * @memberof AmazingMarvinPlugin
   */
  onunload(): void {
    console.log('Amazing Marvin plugin unloaded');
  }

  /**
   * @memberof AmazingMarvinPlugin
   */
  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_APP_SETTINGS, await this.loadData());
  }

  /**
   * @memberof AmazingMarvinPlugin
   */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

/**
 * @class SettingTab
 * @extends {PluginSettingTab}
 */
class SettingTab extends PluginSettingTab {
  plugin: AmazingMarvinPlugin;

  /**
   * Creates an instance of SettingTab.
   * @param {App} app
   * @param {AmazingMarvinPlugin} plugin
   * @memberof SettingTab
   */
  constructor(app: App, plugin: AmazingMarvinPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * @memberof SettingTab
   */
  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Amazing Marvin API settings' });
    const description = containerEl.createEl('p', {
      text: 'Configure API tokens to interact with Amazing Marvin API.',
    });
    description.createEl('br');
    description.createEl('span', { text: 'For more information, please go here - ' });
    description.createEl('a', {
      text: 'https://github.com/amazingmarvin/MarvinAPI/wiki/Marvin-API',
      href: 'https://github.com/amazingmarvin/MarvinAPI/wiki/Marvin-API',
    });

    new Setting(containerEl).setName('apiToken').addText(text =>
      text
        .setPlaceholder('Enter your apiToken')
        .setValue(this.plugin.settings.apiToken)
        .onChange(async apiToken => {
          const apiTokenTrimmed = apiToken.trim();
          this.plugin.settings.apiToken = apiTokenTrimmed;
          this.plugin.amazingMarvinApi.changeToken(apiTokenTrimmed);
          await this.plugin.saveSettings();
        })
    );
  }
}
