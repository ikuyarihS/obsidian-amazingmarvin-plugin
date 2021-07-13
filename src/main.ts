import { addIcon, App, Notice, Plugin, PluginManifest } from 'obsidian';
import type { AmazingMarvinPlugin, PluginSettings } from './@types/index';
import { LeafViewType } from './@types/index';
import AmazingMarvinApi from './api';
import FileManager from './fileManager';
import { icons } from './icons';
import { LeafView } from './leaf';
import DailyNoteModal from './modals/dailyNotes';
import SettingTab from './settings';
import { DEFAULT_APP_SETTINGS } from './utils/constants';

/**
 * @export
 * @class AmazingMarvinPlugin
 * @extends {Plugin}
 */
export default class MyPlugin extends Plugin implements AmazingMarvinPlugin {
  settings: PluginSettings;
  amazingMarvinApi: AmazingMarvinApi;
  fileManager: FileManager;
  ribbon: HTMLElement;
  leafView: LeafView;

  /**
   * Creates an instance of MyPlugin.
   * @param {App} app
   * @param {PluginManifest} manifest
   * @memberof MyPlugin
   */
  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.amazingMarvinApi = new AmazingMarvinApi();
    this.fileManager = new FileManager(this);
  }

  /**
   * @memberof AmazingMarvinPlugin
   */
  async onload(): Promise<void> {
    await this.loadSettings();
    this.amazingMarvinApi.changeToken(this.settings.apiToken);

    this.registerView(LeafViewType, leaf => (this.leafView = new LeafView(leaf, this)));
    this.registerMarkdownPostProcessor(this.amazingMarvinApi.parseCodeblock.bind(this.amazingMarvinApi));
    this.addSettingTab(new SettingTab(this.app, this));

    this.addCommand({
      id: 'scheduled-daily-note',
      name: 'Add scheduled tasks to daily note',
      checkCallback: (checking: boolean) => {
        if (!checking) {
          this.settings.showRibbon
            ? new DailyNoteModal(this).open()
            : new Notice('Please enable ribbon to use this command!');
        }
        return checking;
      },
    });

    addIcon('amazing-marvin-ribbon', icons.ribbon);
    this.showRibbon(this.settings.showRibbon);

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

  /**
   * @param {boolean} value
   * @memberof AmazingMarvinPlugin
   */
  showRibbon(value: boolean): void {
    if (value) {
      this.ribbon = this.addRibbonIcon('amazing-marvin-ribbon', 'Amazing Marvin', () => this.toggleLeafView());
    } else if (this.ribbon) {
      this.ribbon.remove();
    }
  }

  /**
   * @private
   * @return {Promise<void>}
   * @memberof MyPlugin
   */
  private async toggleLeafView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(LeafViewType);
    if (existing.length) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }

    await this.app.workspace.getRightLeaf(false).setViewState({
      type: LeafViewType,
      active: true,
    });

    this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(LeafViewType)[0]);
  }
}
