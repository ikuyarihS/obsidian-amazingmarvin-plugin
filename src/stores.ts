import type { TFile } from 'obsidian';
import { getAllDailyNotes, getDateFromFile, getDateUID } from 'obsidian-daily-notes-interface';
import { writable } from 'svelte/store';

/**
 * @return {any}
 */
function createDailyNotesStore() {
  let hasError = false;
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => {
      try {
        const dailyNotes = getAllDailyNotes();
        store.set(dailyNotes);
        hasError = false;
      } catch (err) {
        if (!hasError) {
          // Avoid error being shown multiple times
          console.log('[Calendar] Failed to find daily notes folder', err);
        }
        store.set({});
        hasError = true;
      }
    },
    ...store,
  };
}

/**
 * @export
 * @param {(TFile | null)} file
 * @return {string}
 */
export function getDateUIDFromFile(file: TFile | null): string {
  if (!file) {
    return null;
  }

  // TODO: I'm not checking the path!
  let date = getDateFromFile(file, 'day');
  if (date) {
    return getDateUID(date, 'day');
  }

  date = getDateFromFile(file, 'week');
  if (date) {
    return getDateUID(date, 'week');
  }
  return null;
}

/**
 * @return {any}
 */
function createSelectedFileStore() {
  const store = writable<string>(null);

  return {
    setFile: (file: TFile) => {
      const id = getDateUIDFromFile(file);
      store.set(id);
    },
    ...store,
  };
}

export const dailyNotes = createDailyNotesStore();
export const activeFile = createSelectedFileStore();
