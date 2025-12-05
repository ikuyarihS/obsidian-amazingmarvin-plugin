import type { App } from 'obsidian';
import { PluginSettingTab, Setting } from 'obsidian';
import type { AmazingMarvinPlugin } from './@types';
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

    new Setting(containerEl)
      .setName('apiToken')
      .setDesc('The API token needed to interact with Amazing Marvin')
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

    new Setting(containerEl)
      .setName('Show ribbon')
      .setDesc('Show plugin ribbon on the left sidebar')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.showRibbon).onChange(async isShowRibbon => {
          this.plugin.settings.showRibbon = isShowRibbon;
          this.plugin.showRibbon(isShowRibbon);
          isShowRibbon ? (ribbonQuerySetting.settingEl.style.display = '') : (ribbonQuerySetting.settingEl.style.display = 'none');
          await this.plugin.saveSettings();
        });
      });

    const ribbonQuerySetting = new Setting(containerEl).setName("Ribbon's Query").setDesc('The query for the ribbon');
    this.plugin.settings.showRibbon ? (ribbonQuerySetting.settingEl.style.display = '') : (ribbonQuerySetting.settingEl.style.display = 'none');

    ribbonQuerySetting.controlEl.style.display = 'inline';
    new Setting(ribbonQuerySetting.controlEl.createDiv('amazing-marvin-ribbon-query-setting-dropdown'))
      .setName('type')
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
    Object.entries(this.plugin.settings.ribbonQuery).forEach(([name, value]) => {
      if (typeof value === 'boolean') {
        const parent = ribbonQuerySetting.controlEl.createDiv('amazing-marvin-ribbon-query-setting-toggle');
        parent.style.color = this.plugin.settings.showRibbon ? undefined : 'gray';
        parent.style.display = 'block';
        new Setting(parent).setName(name).addToggle(toggle => {
          toggle.setDisabled(!this.plugin.settings.showRibbon);
          toggle.setValue(value).onChange(async newValue => {
            this.plugin.settings.ribbonQuery = { ...this.plugin.settings.ribbonQuery, [name]: newValue };
            this.isRibbonSettingChanged = true;
            await this.plugin.saveSettings();
          });
        });
      }
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
          this.plugin.leafView.draw();
        }
      } catch (err) {
        console.warn('Failed to redraw leaf view after settings change', err);
      }
      this.isRibbonSettingChanged = false;
    }
  }
}
