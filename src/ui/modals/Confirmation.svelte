<script lang="ts">
  import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
  import Icon from 'svelte-awesome';

  export let title: string;
  export let description: string;
  export let cta: string;
  export let handleCancel: () => void;
  export let handleCreate: (e: any) => Promise<void>;

  let isCreating = false;

  async function create(e: MouseEvent) {
    isCreating = true;
    await handleCreate(e);
    isCreating = false;
  }
</script>

<h2>{title}</h2>
<p>{description}</p>
<div class="modal-button-container">
  <button on:click={handleCancel}>Cancel</button>
  <button on:click={e => create(e)}>
    {#if isCreating}
      <Icon class="icon daily-note" data={faSyncAlt} spin />
      Creating, please wait
    {:else}
      {cta}
    {/if}
  </button>
</div>
