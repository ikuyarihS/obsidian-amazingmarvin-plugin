import moment from 'moment';
import { Modal } from 'obsidian';
import type { AmazingMarvinPlugin, Query } from '../@types/index';
import DailyNoteCommand from '../ui/DailyNoteCommand.svelte';

/**
 * @class SampleModal
 * @extends {Modal}
 */
export default class DailyNoteModal extends Modal {
  plugin: AmazingMarvinPlugin;

  /**
   * Creates an instance of DailyNoteModal.
   * @param {AmazingMarvinPlugin} plugin
   * @memberof DailyNoteModal
   */
  constructor(plugin: AmazingMarvinPlugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  /**
   * @memberof SampleModal
   */
  onOpen(): void {
    const { contentEl } = this;
    new DailyNoteCommand({
      target: contentEl,
      props: {
        handleCancel: this.close,
        handleCreate: async (query: Query, api: string) => {
          await this.plugin.fileManager.openOrCreateDailyNote(moment(), query, api);
          this.close();
        },
      },
    });
  }

  /**
   * @memberof SampleModal
   */
  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
