import type { AmazingMarvinPlugin } from '../@types';
import type { TFile } from 'obsidian';

export interface LoggerOptions {
  writeToFile?: boolean;
  filename?: string;
}

export default function createLogger(plugin: AmazingMarvinPlugin, opts?: LoggerOptions) {
  const writeToFile = opts?.writeToFile ?? false;
  const filename = opts?.filename ?? 'plugin.log';
  const pluginId = (plugin && plugin.manifest && plugin.manifest.id) || 'unknown-plugin';
  const logPath = `.obsidian/plugins/${pluginId}/${filename}`;

  async function writeFileLine(level: string, message: string) {
    if (!writeToFile) return;
    try {
      const absFile = plugin.app.vault.getAbstractFileByPath(logPath);
      const line = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}\n`;
      if (absFile && (absFile as TFile).path) {
        const content = await plugin.app.vault.read(absFile as TFile);
        await plugin.app.vault.modify(absFile as TFile, content + line);
      } else {
        await plugin.app.vault.create(logPath, line);
      }
    } catch (e) {
      console.error('[Logger] Failed to write to file', e);
    }
  }

  return {
    info: (msg: string) => {
      console.log(`[${pluginId}] ${msg}`);
      writeFileLine('info', msg);
    },
    debug: (msg: string) => {
      console.debug(`[${pluginId}] ${msg}`);
      writeFileLine('debug', msg);
    },
    warn: (msg: string) => {
      console.warn(`[${pluginId}] ${msg}`);
      writeFileLine('warn', msg);
    },
    error: (msg: string) => {
      console.error(`[${pluginId}] ${msg}`);
      writeFileLine('error', msg);
    },
    write: (level: string, msg: string) => writeFileLine(level, msg),
  };
}
