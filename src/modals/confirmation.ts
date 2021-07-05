import { App, Modal } from 'obsidian';
import Confirmation from '../ui/modals/Confirmation.svelte';

interface IConfirmationDialogParams {
  cta: string;
  onAccept: (...args: any[]) => Promise<void>;
  text: string;
  title: string;
}

/**
 * @export
 * @class ConfirmationModal
 * @extends {Modal}
 */
export class ConfirmationModal extends Modal {
  /**
   * Creates an instance of ConfirmationModal.
   * @param {App} app
   * @param {IConfirmationDialogParams} config
   * @memberof ConfirmationModal
   */
  constructor(app: App, config: IConfirmationDialogParams) {
    super(app);

    const { cta, onAccept, text, title } = config;
    new Confirmation({
      target: this.contentEl,
      props: {
        title: title,
        description: text,
        cta: cta,
        handleCancel: this.close,
        handleCreate: async (e: Event) => {
          await onAccept(e);
          this.close();
        },
      },
    });
  }
}

/**
 * @export
 * @param {IConfirmationDialogParams} { cta, onAccept, text, title }
 */
export function createConfirmationDialog({ cta, onAccept, text, title }: IConfirmationDialogParams): void {
  new ConfirmationModal(
    // @ts-expect-error: Property 'app' does not exist on type 'Window & typeof globalThis'.ts(2339)
    window.app,
    { cta, onAccept, text, title }
  ).open();
}
