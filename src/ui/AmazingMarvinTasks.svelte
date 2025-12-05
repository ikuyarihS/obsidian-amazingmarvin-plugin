<script lang="ts">
  import { faFile, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
  import moment from 'moment';
  import { onMount } from 'svelte';
  import Icon from 'svelte-awesome';
  import type { Query } from '../@types';
  import ErrorDisplay from './ErrorDisplay.svelte';
  import Item from './Item.svelte';

  export let query: Query;
  export let getData: (query: Query, api: string) => Promise<any[]>;
  export let api: string;
  export let openOrCreateDailyNote: (date: moment.Moment, query: Query, api: string) => Promise<void> = undefined;

  let lastRefresh = Date.now();
  let lastUpdate = '';
  let isLoading = false;
  let isAddingToDailyNote = false;

  const fetchData = async () => {
    isLoading = true;
    try {
      console.debug(`Fetching ${api} for query ${query?.title || query?.type || '<unnamed>'}`);
      const result = await getData(query, api);
      console.debug(`Fetched ${api} for query ${query?.title || query?.type || '<unnamed>'}`);
      return result;
    } catch (err) {
      console.error('Error in fetchData', err);
      throw err;
    } finally {
      isLoading = false;
      lastRefresh = Date.now();
    }
  };

  const handleRefresh = async () => {
    console.debug('handleRefresh triggered');
    promise = fetchData();
    try {
      await promise;
      console.debug('handleRefresh completed');
    } catch (err) {
      console.error('handleRefresh error', err);
    }
  };

  const handleDailyNote = async () => {
    isAddingToDailyNote = true;
    await openOrCreateDailyNote(moment(), query, api);
    isAddingToDailyNote = false;
  };

  let promise = fetchData();

  onMount(() => {
    const updateInterval = setInterval(() => {
      lastUpdate = moment(lastRefresh).fromNow();
    }, 1000);

    return () => {
      clearInterval(updateInterval);
    };
  });
</script>

<div class="amazing-marvin-container">
  {#if query.title || query.type}
    <h3>{query.title || query.type}</h3>
  {/if}

  <div class="button-group">
    <button class="button refresh" on:click={() => handleRefresh()} disabled={isLoading}>
      <Icon class="icon refresh" data={faSyncAlt} spin={isLoading} />
      {isLoading ? 'Updating' : lastUpdate}
    </button>
    {#if openOrCreateDailyNote}
      <button class="button daily-note" on:click={() => handleDailyNote()} disabled={isLoading}>
        <Icon class="icon daily-note" data={isAddingToDailyNote ? faSyncAlt : faFile} spin={isAddingToDailyNote} />
        Daily note
      </button>
    {/if}
  </div>

  {#if !isLoading}
    {#await promise then res}
      {#if res}
        <Item {query} items={res[0] || []} labels={res[1] || {}} />
      {/if}
    {:catch error}
      <ErrorDisplay {error} />
    {/await}
  {/if}
</div>
