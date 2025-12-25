import type { App } from 'obsidian';
import { PluginSettingTab, Setting } from 'obsidian';
import type { AmazingMarvinPlugin, LeafDefaultView } from './@types';
import SettingFooter from './ui/settings/Footer.svelte';
import SettingHeader from './ui/settings/Header.svelte';

/**
 * @class SettingTab
 * @extends {PluginSettingTab}
 */
export default class SettingTab extends PluginSettingTab {
  plugin: AmazingMarvinPlugin;
  private isRibbonSettingChanged: boolean = false;

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
    new SettingHeader({ target: containerEl });

    containerEl.createEl('h3', { text: 'Account' });

    new Setting(containerEl)
      .setName('API token')
      .setDesc('Your Amazing Marvin API token (stored locally in Obsidian).')
      .addText(text => {
        text.inputEl.type = 'password';
        text
          .setPlaceholder('Enter your apiToken')
          .setValue(this.plugin.settings.apiToken)
          .onChange(async apiToken => {
            const apiTokenTrimmed = apiToken.trim();
            this.plugin.settings.apiToken = apiTokenTrimmed;
            this.plugin.amazingMarvinApi.changeToken(apiTokenTrimmed);
            await this.plugin.saveSettings();
          });
      });

    containerEl.createEl('h3', { text: 'Ribbon leaf' });

    new Setting(containerEl)
      .setName('Show ribbon icon')
      .setDesc('Adds the Amazing Marvin icon to the left ribbon.')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.showRibbon).onChange(async isShowRibbon => {
          this.plugin.settings.showRibbon = isShowRibbon;
          this.plugin.showRibbon(isShowRibbon);
          this.isRibbonSettingChanged = true;

          isShowRibbon
            ? (ribbonQuerySetting.settingEl.style.display = '')
            : (ribbonQuerySetting.settingEl.style.display = 'none');
          defaultLeafViewSetting.setDisabled(!isShowRibbon);
          await this.plugin.saveSettings();
        });
      });

    const defaultLeafViewSetting = new Setting(containerEl)
      .setName('Default view')
      .setDesc('The default view when opening the ribbon leaf.')
      .addDropdown(dropdown => {
        dropdown
          .addOptions({
            list: 'List',
            week: 'Calendar (Week)',
            month: 'Calendar (Month)',
          })
          .setValue(this.plugin.settings.defaultLeafView)
          .onChange(async value => {
            const nextValue: LeafDefaultView = value === 'week' || value === 'month' ? value : 'list';
            this.plugin.settings.defaultLeafView = nextValue;
            this.isRibbonSettingChanged = true;
            await this.plugin.saveSettings();
          });
      });
    defaultLeafViewSetting.setDisabled(!this.plugin.settings.showRibbon);

    const ribbonQuerySetting = new Setting(containerEl)
      .setName('Ribbon list query')
      .setDesc('Controls the task list tab in the ribbon leaf.');
    this.plugin.settings.showRibbon
      ? (ribbonQuerySetting.settingEl.style.display = '')
      : (ribbonQuerySetting.settingEl.style.display = 'none');

    ribbonQuerySetting.controlEl.style.display = 'inline';
    new Setting(ribbonQuerySetting.controlEl.createDiv('amazing-marvin-ribbon-query-setting-dropdown'))
      .setName('Type')
      .addDropdown(dropdown => {
        dropdown
          .addOptions({
            today: 'Scheduled today',
            'due-today': 'Due today',
          })
          .setValue(this.plugin.settings.ribbonQuery.type)
          .onChange(async (value: 'today' | 'due-today') => {
            this.plugin.settings.ribbonQuery = { ...this.plugin.settings.ribbonQuery, type: value };
            this.isRibbonSettingChanged = true;
            await this.plugin.saveSettings();
          });
      });

    const ribbonToggleLabels: Record<string, string> = {
      showNote: 'Show notes',
      hideEmpty: 'Hide empty groups',
      showLabel: 'Show labels',
      isAnimated: 'Animate transitions',
      colorTitle: 'Color titles',
      inheritColor: 'Inherit colors',
    };

    (Object.entries(this.plugin.settings.ribbonQuery) as Array<[string, unknown]>).forEach(([key, value]) => {
      if (typeof value !== 'boolean') return;

      const parent = ribbonQuerySetting.controlEl.createDiv('amazing-marvin-ribbon-query-setting-toggle');
      parent.style.color = this.plugin.settings.showRibbon ? undefined : 'gray';
      parent.style.display = 'block';

      new Setting(parent).setName(ribbonToggleLabels[key] ?? key).addToggle(toggle => {
        toggle.setDisabled(!this.plugin.settings.showRibbon);
        toggle.setValue(value).onChange(async newValue => {
          this.plugin.settings.ribbonQuery = { ...this.plugin.settings.ribbonQuery, [key]: newValue };
          this.isRibbonSettingChanged = true;
          await this.plugin.saveSettings();
        });
      });
    });

    new SettingFooter({ target: containerEl });
  }

  /**
   * @memberof SettingTab
   */
  public hide(): void {
    super.hide();

    if (this.isRibbonSettingChanged) {
      try {
        if (this.plugin.leafView && typeof this.plugin.leafView.draw === 'function') {
          void this.plugin.leafView.draw().catch(err => {
            console.warn('Failed to redraw leaf view after settings change', err);
          });
        }
      } catch (err) {
        console.warn('Failed to redraw leaf view after settings change', err);
      }
      this.isRibbonSettingChanged = false;
    }
  }
}
