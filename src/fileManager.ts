import type moment from 'moment';
import type { TFile } from 'obsidian';
import { createDailyNote, getDailyNote, getDailyNoteSettings } from 'obsidian-daily-notes-interface';
import { get } from 'svelte/store';
import type { AmazingMarvinPlugin, Query } from './@types/index';
import { createConfirmationDialog } from './modals/confirmation';
import { activeFile, dailyNotes } from './stores';
import { parseIntoNotes } from './utils';

const amazingMarvinNoteRegex = /(___\nAmazing Marvin\n)([\s\S]+)(\n___)/gim;

/**
 * @export
 * @class FileManager
 */
export default class FileManager {
  plugin: AmazingMarvinPlugin;

  /**
   * Creates an instance of FileManager.
   * @param {AmazingMarvinPlugin} plugin
   * @memberof FileManager
   */
  constructor(plugin: AmazingMarvinPlugin) {
    this.plugin = plugin;
  }

  /**
   * @param {moment.Moment} date
   * @param {any} [cb]
   * @return {Promise<void>}
   * @memberof FileManager
   */
  async createFile(date: moment.Moment, cb?: (newFile: TFile) => void): Promise<void> {
    const dailyNote = await createDailyNote(date);
    const leaf = this.plugin.app.workspace.getLeafById('amazing-marvin-leaf');

    await leaf.openFile(dailyNote, { active: true });
    cb?.(dailyNote);
  }

  /**
   * @param {moment.Moment} date
   * @memberof FileManager
   */
  createDailyNote(date: moment.Moment): void {
    const { format } = getDailyNoteSettings();
    createConfirmationDialog({
      cta: 'Create',
      onAccept: this.createFile,
      text: `File ${date.format(format)} does not exist. Would you like to create it?`,
      title: 'New Daily Note',
    });
  }

  /**
   * @param {moment.Moment} date
   * @param {any} [cb]
   * @return {Promise<void>}
   * @memberof FileManager
   */
  async tryToCreateDailyNote(date: moment.Moment, cb?: (newFile: TFile) => void): Promise<void> {
    const { workspace } = this.plugin.app;
    const { format } = getDailyNoteSettings();
    const filename = date.format(format);

    const createFile = async () => {
      const dailyNote = await createDailyNote(date);
      const leaf = workspace.getUnpinnedLeaf();

      await leaf.openFile(dailyNote, { active: true });
      cb?.(dailyNote);
    };

    createConfirmationDialog({
      cta: 'Create',
      onAccept: createFile,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: 'New Daily Note',
    });
  }

  /**
   * @param {moment.Moment} date
   * @param {Query} query
   * @param {string} api
   * @return {Promise<void>}
   * @memberof FileManager
   */
  async openOrCreateDailyNote(date: moment.Moment, query: Query, api: string): Promise<void> {
    const { workspace } = this.plugin.app;
    dailyNotes.reindex();
    const existingFile = getDailyNote(date, get(dailyNotes));
    if (!existingFile) {
      // File doesn't exist
      this.tryToCreateDailyNote(date, (dailyNote: TFile) => {
        activeFile.setFile(dailyNote);
      });
      return;
    } else {
      const mode = (this.plugin.app.vault as any).getConfig('defaultViewMode');
      const leaf = workspace.getUnpinnedLeaf();
      await leaf.openFile(existingFile, { active: true, mode });
      activeFile.setFile(existingFile);
    }
    await this.addToDailyNote(existingFile, query, api);
  }

  /**
   * @param {TFile} existingFile
   * @param {Query} query
   * @param {string} api
   * @return {Promise<void>}
   * @memberof FileManager
   */
  async addToDailyNote(existingFile: TFile, query: Query, api: string): Promise<void> {
    const [items, _] = await this.plugin.amazingMarvinApi.getData(query, api);
    const amazingMarvinNote = parseIntoNotes(items).join('\n');
    const adapter = existingFile.vault.adapter;
    let fileContent = await adapter.read(existingFile.path);
    if (amazingMarvinNoteRegex.test(fileContent)) {
      fileContent = fileContent.replace(
        amazingMarvinNoteRegex,
        (_match, prefix, _content, postfix) => `${prefix}${amazingMarvinNote}${postfix}`
      );
    } else {
      fileContent += `\n___\nAmazing Marvin\n${amazingMarvinNote}\n___`;
    }
    await adapter.write(existingFile.path, fileContent.trim());
  }
}
