// Using `any` for dates to avoid type mismatches between moment instances
import type { TFile } from 'obsidian';
import { createDailyNote, getDailyNote, getDailyNoteSettings } from 'obsidian-daily-notes-interface';
import { get } from 'svelte/store';
import type { AmazingMarvinPlugin, Query } from './@types/index';
import { createConfirmationDialog } from './modals/confirmation';
import { activeFile, dailyNotes } from './stores';
import { parseIntoNotes } from './utils';

const amazingMarvinNoteRegex = /(___\nAmazing Marvin\n)([\s\S]+?)(\n___)/im;

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
  async createFile(date: any, cb?: (newFile: TFile) => void): Promise<void> {
    const dailyNote = (await createDailyNote(date)) as unknown as TFile;
    const leaf = this.plugin.app.workspace.getUnpinnedLeaf();

    await leaf.openFile(dailyNote, { active: true });
    cb?.(dailyNote);
  }

  /**
   * @param {moment.Moment} date
   * @memberof FileManager
   */
  createDailyNote(date: any): void {
    const { format } = getDailyNoteSettings();
    createConfirmationDialog(this.plugin.app, {
      cta: 'Create',
      onAccept: () => this.createFile(date),
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
  async tryToCreateDailyNote(date: any, cb?: (newFile: TFile) => void): Promise<void> {
    const { workspace } = this.plugin.app;
    const { format } = getDailyNoteSettings();
    const filename = date.format(format);

    const createFile = async () => {
      const dailyNote = (await createDailyNote(date)) as unknown as TFile;
      const leaf = workspace.getUnpinnedLeaf();

      await leaf.openFile(dailyNote, { active: true });
      cb?.(dailyNote);
    };

    createConfirmationDialog(this.plugin.app, {
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
  async openOrCreateDailyNote(date: any, query: Query, api: string): Promise<void> {
    const { workspace } = this.plugin.app;
    dailyNotes.reindex();
    const existingFile = (getDailyNote(date, get(dailyNotes) as any) as unknown) as TFile | undefined;
    if (!existingFile) {
      // File doesn't exist
      await this.tryToCreateDailyNote(date, async (dailyNote: TFile) => {
        activeFile.setFile(dailyNote);
        await this.addToDailyNote(dailyNote, query, api);
      });
    } else {
            const leaf = workspace.getUnpinnedLeaf();
      await leaf.openFile(existingFile, { active: true });
      activeFile.setFile(existingFile);
      await this.addToDailyNote(existingFile, query, api);
    }
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
    let fileContent = await this.plugin.app.vault.read(existingFile);
    if (amazingMarvinNoteRegex.test(fileContent)) {
      fileContent = fileContent.replace(
        amazingMarvinNoteRegex,
        (_match, prefix, _content, postfix) => `${prefix}${amazingMarvinNote}${postfix}`
      );
    } else {
      fileContent += `\n___\nAmazing Marvin\n${amazingMarvinNote}\n___`;
    }
    await this.plugin.app.vault.modify(existingFile, fileContent.trim());
  }
}
