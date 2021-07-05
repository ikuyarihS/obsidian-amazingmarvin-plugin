import { Editor, ItemView, MarkdownView, WorkspaceLeaf } from 'obsidian';
import { AmazingMarvinPlugin, LeafViewType } from './@types/index';
import AmazingMarvinTasks from './ui/AmazingMarvinTasks.svelte';
import { dailyNotes } from './stores';

/**
 * @export
 * @class LeafView
 * @extends {ItemView}
 */
export class LeafView extends ItemView {
  editor: Editor;
  plugin: AmazingMarvinPlugin;

  /**
   * Creates an instance of LeafView.
   * @param {WorkspaceLeaf} leaf
   * @param {AmazingMarvinPlugin} plugin
   * @memberof LeafView
   */
  constructor(leaf: WorkspaceLeaf, plugin: AmazingMarvinPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  /**
   * @return {string}
   * @memberof LeafView
   */
  public getDisplayText(): string {
    return 'Amazing Marvin';
  }

  /**
   * @return {string}
   * @memberof LeafView
   */
  public getViewType(): string {
    return LeafViewType;
  }

  /**
   * @return {string}
   * @memberof LeafView
   */
  public getIcon(): string {
    return 'amazing-marvin-ribbon';
  }

  /**
   * @memberof LeafView
   */
  public load(): void {
    super.load();

    this.app.workspace.on('active-leaf-change', leaf => {
      if (leaf.view instanceof MarkdownView) this.editor = leaf.view.editor;
    });

    this.draw();
  }

  /**
   * @private
   * @return {Promise<void>}
   * @memberof LeafView
   */
  public async draw(): Promise<void> {
    if (this.plugin.settings.showRibbon) {
      this.containerEl.show();
      new AmazingMarvinTasks({
        target: this.contentEl,
        props: {
          query: this.plugin.settings.ribbonQuery,
          getData: this.plugin.amazingMarvinApi.getData.bind(this.plugin.amazingMarvinApi),
          api: this.plugin.amazingMarvinApi.getApiFromType(this.plugin.settings.ribbonQuery.type),
          openOrCreateDailyNote: this.plugin.fileManager.openOrCreateDailyNote.bind(this.plugin.fileManager),
        },
      });
    } else {
      this.containerEl.hide();
    }
  }
}
