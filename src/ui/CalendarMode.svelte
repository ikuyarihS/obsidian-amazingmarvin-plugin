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
  export let openOrCreateDailyNote: (date: moment.Moment, query: Query, api: string) => Promise<void>;

  type ViewMode = 'week' | 'month';

  export let defaultViewMode: ViewMode = 'week';

  const DOW_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  // Marvin API guidance: do not burst more than 1 query each 3 seconds.
  const MIN_REQUEST_SPACING_MS = 3000;

  let viewMode: ViewMode = defaultViewMode;
  let selectedDate = moment();

  let isFetching = false;
  let isRefreshScheduled = false;
  $: isLoading = isFetching || isRefreshScheduled;

  let isAddingToDailyNote = false;
  let error: Error | null = null;
  let items: any[] = [];
  let labels: Record<string, any> = {};

  let lastRefresh = Date.now();
  let lastUpdate = moment(lastRefresh).fromNow();
  let requestToken = 0;

  let nextAllowedRequestAt = 0;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  let refreshScheduleToken = 0;

  const apiForSelectedDate = () => `todayItems?date=${selectedDate.format('YYYY-MM-DD')}`;

  const fetchForSelectedDate = async () => {
    const token = ++requestToken;
    error = null;
    isFetching = true;
    nextAllowedRequestAt = Date.now() + MIN_REQUEST_SPACING_MS;

    try {
      const res = await getData(query, apiForSelectedDate());
      if (token !== requestToken) return;
      items = res?.[0] || [];
      labels = res?.[1] || {};
    } catch (e) {
      if (token !== requestToken) return;
      error = e instanceof Error ? e : new Error(String(e));
      items = [];
      labels = {};
    } finally {
      if (token === requestToken) {
        isFetching = false;
        lastRefresh = Date.now();
      }
    }
  };

  const scheduleRefresh = () => {
    const myScheduleToken = ++refreshScheduleToken;

    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }

    const delayMs = Math.max(0, nextAllowedRequestAt - Date.now());
    isRefreshScheduled = delayMs > 0;

    refreshTimer = setTimeout(() => {
      if (myScheduleToken !== refreshScheduleToken) return;
      refreshTimer = null;
      isRefreshScheduled = false;
      void fetchForSelectedDate();
    }, delayMs);
  };

  const refresh = () => {
    scheduleRefresh();
  };

  const selectDate = (date: moment.Moment) => {
    selectedDate = date.clone();
    refresh();
  };

  const goToday = () => selectDate(moment());

  const step = (delta: number) => {
    if (viewMode === 'week') {
      selectDate(selectedDate.clone().add(delta, 'week'));
    } else {
      selectDate(selectedDate.clone().add(delta, 'month'));
    }
  };

  const handleDailyNote = async () => {
    isAddingToDailyNote = true;
    try {
      await openOrCreateDailyNote(selectedDate.clone(), query, apiForSelectedDate());
    } finally {
      isAddingToDailyNote = false;
    }
  };

  $: weekStart = selectedDate.clone().startOf('isoWeek');
  $: weekDays = Array.from({ length: 7 }, (_v, i) => weekStart.clone().add(i, 'day'));

  $: monthStart = selectedDate.clone().startOf('month').startOf('isoWeek');
  $: monthEnd = selectedDate.clone().endOf('month').endOf('isoWeek');
  $: monthDays = (() => {
    const days: moment.Moment[] = [];
    const cursor = monthStart.clone();
    while (cursor.isSameOrBefore(monthEnd, 'day')) {
      days.push(cursor.clone());
      cursor.add(1, 'day');
    }
    return days;
  })();

  onMount(() => {
    refresh();

    const updateInterval = setInterval(() => {
      lastUpdate = moment(lastRefresh).fromNow();
    }, 1000);

    return () => {
      clearInterval(updateInterval);

      // Invalidate any pending refresh timer and in-flight fetches to avoid
      // updating state after the component has been destroyed.
      refreshScheduleToken++;
      requestToken++;

      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
    };
  });
</script>

<div class="amazing-marvin-calendar">
  <div class="amazing-marvin-calendar-toolbar">
    <div class="amazing-marvin-calendar-nav">
      <button class="button" on:click={() => step(-1)} aria-label="Previous">‹</button>
      <button class="button" on:click={() => goToday()}>Today</button>
      <button class="button" on:click={() => step(1)} aria-label="Next">›</button>
    </div>

    <div class="amazing-marvin-calendar-title">{selectedDate.format('MMM YYYY')}</div>

    <div class="amazing-marvin-calendar-view-toggle">
      <button
        class="button"
        class:is-active={viewMode === 'week'}
        on:click={() => {
          viewMode = 'week';
        }}>
        Week
      </button>
      <button
        class="button"
        class:is-active={viewMode === 'month'}
        on:click={() => {
          viewMode = 'month';
        }}>
        Month
      </button>
    </div>
  </div>

  {#if viewMode === 'week'}
    <div class="amazing-marvin-calendar-week">
      {#each weekDays as day, i}
        <button
          class="amazing-marvin-calendar-day"
          class:is-selected={day.isSame(selectedDate, 'day')}
          class:is-today={day.isSame(moment(), 'day')}
          on:click={() => selectDate(day)}
          aria-label={day.format('YYYY-MM-DD')}>
          <div class="dow">{DOW_LETTERS[i]}</div>
          <div class="dom">{day.date()}</div>
        </button>
      {/each}
    </div>
  {:else}
    <div class="amazing-marvin-calendar-month">
      <div class="amazing-marvin-calendar-dow-row">
        {#each DOW_LETTERS as letter}
          <div class="amazing-marvin-calendar-dow">{letter}</div>
        {/each}
      </div>
      <div class="amazing-marvin-calendar-grid">
        {#each monthDays as day}
          <button
            class="amazing-marvin-calendar-day"
            class:is-outside={day.month() !== selectedDate.month()}
            class:is-selected={day.isSame(selectedDate, 'day')}
            class:is-today={day.isSame(moment(), 'day')}
            on:click={() => selectDate(day)}
            aria-label={day.format('YYYY-MM-DD')}>
            <div class="dom">{day.date()}</div>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="amazing-marvin-calendar-tasks">
    <div class="amazing-marvin-calendar-tasks-header">
      <h3>Tasks · {selectedDate.format('YYYY-MM-DD')}</h3>
      <div class="button-group">
        <button class="button refresh" on:click={() => refresh()} disabled={isLoading}>
          <Icon class="icon refresh" data={faSyncAlt} spin={isLoading} />
          {isLoading ? 'Updating' : lastUpdate}
        </button>
        <button
          class="button daily-note"
          on:click={() => handleDailyNote()}
          disabled={isLoading || isAddingToDailyNote}>
          <Icon class="icon daily-note" data={isAddingToDailyNote ? faSyncAlt : faFile} spin={isAddingToDailyNote} />
          Daily note
        </button>
      </div>
    </div>

    {#if error}
      <ErrorDisplay {error} />
    {:else}
      <Item {query} {items} {labels} />
    {/if}
  </div>
</div>
