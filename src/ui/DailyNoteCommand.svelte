<script lang="ts">
  import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
  import Icon from 'svelte-awesome';
  import type { Query } from '../@types';
  import { DEFAULT_APP_SETTINGS } from '../utils/constants';

  export let handleCancel: () => void;
  export let handleCreate: (query: Query, api: string) => Promise<void>;

  let isCreating = false;
  const query: Query = { ...DEFAULT_APP_SETTINGS.ribbonQuery };
  let api: string = 'dueItems';

  async function create() {
    isCreating = true;
    query.type = api === 'todayItems' ? 'today' : 'due-today';
    try {
      await handleCreate(query, api);
    } finally {
      isCreating = false;
    }
  }
</script>

<h2>Add to daily note</h2>
<select bind:value={api}>
  <option value="todayItems">Scheduled Today</option>
  <option value="dueItems">Due Today</option>
</select>
<div class="modal-button-container">
  <button on:click={() => handleCancel()}>Cancel</button>
  <button on:click={() => create()}>
    {#if isCreating}
      <Icon class="icon daily-note" data={faSyncAlt} spin />
      Creating, please wait
    {:else}
      Create
    {/if}
  </button>
</div>
