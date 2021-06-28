<script lang="ts">
  import type { Label, Query } from '../@types';
  import Item from './Item.svelte';

  export let query: Query;
  export let getData: (query: Query, api: string) => Promise<any[]>;
  export let api: string;

  let isLoading = false;
  let items: Item[] = [];
  let labelsMap: Record<string, Label>;

  let promise = get();

  async function get() {
    isLoading = true;
    try {
      items.length = 0;
      [items, labelsMap] = await getData(query, api);
    } finally {
      isLoading = false;
    }
  }

  async function handleClick() {
    promise = get();
  }
</script>

<div class="amazing-marvin-container">
  {#if query.title || query.type}
    <h3>{query.title || query.type}</h3>
  {/if}
  <button class="amazing-marvin-refresh-button" on:click={handleClick} disabled={isLoading}>
    {isLoading ? 'Refreshing' : 'Refresh'}
  </button>
  {#if !isLoading}
    {#await promise}
      <Item {query} {items} labels={labelsMap} />
    {/await}
  {/if}
</div>
