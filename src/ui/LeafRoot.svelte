<script lang="ts">
  import type { Moment } from 'moment';
  import type { LeafDefaultView, Query } from '../@types';
  import AmazingMarvinTasks from './AmazingMarvinTasks.svelte';
  import CalendarMode from './CalendarMode.svelte';

  export let defaultLeafView: LeafDefaultView = 'list';

  export let listQuery: Query;
  export let listApi: string;
  export let calendarQuery: Query;

  export let getData: (query: Query, api: string) => Promise<any[]>;
  export let openOrCreateDailyNote: (date: Moment, query: Query, api: string) => Promise<void>;

  type Tab = 'list' | 'calendar';
  const initialTab: Tab = defaultLeafView === 'list' ? 'list' : 'calendar';
  const initialCalendarMode = defaultLeafView === 'month' ? 'month' : 'week';

  let tab: Tab = initialTab;
</script>

<div class="amazing-marvin-leaf-root">
  <div class="amazing-marvin-leaf-tabs">
    <button class="amazing-marvin-leaf-tab" class:is-active={tab === 'list'} on:click={() => (tab = 'list')}
      >List</button
    >
    <button class="amazing-marvin-leaf-tab" class:is-active={tab === 'calendar'} on:click={() => (tab = 'calendar')}
      >Calendar</button
    >
  </div>

  {#if tab === 'list'}
    <AmazingMarvinTasks query={listQuery} api={listApi} {getData} {openOrCreateDailyNote} />
  {:else}
    <CalendarMode query={calendarQuery} defaultViewMode={initialCalendarMode} {getData} {openOrCreateDailyNote} />
  {/if}
</div>
