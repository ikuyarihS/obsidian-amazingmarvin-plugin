<script lang="ts">
  import { faFlag, faFolder, faInbox } from '@fortawesome/free-solid-svg-icons';
  import Icon from 'svelte-awesome';
  import { quintOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  import type { Item, Label, Query } from '../@types';
  import { convertHyperlinks, getNote } from '../utils';
  import { INHERIT_PROPS } from '../utils/constants';

  const ICONS: any = {
    category: faFolder,
    project: faFlag,
    inbox: faInbox,
  };

  export let items: Item[];
  export let query: Query;
  export let labels: Record<string, Label>;

  let note;
</script>

<ul class="amazing-marvin-list" in:fly={{ x: 100, duration: 450, easing: quintOut }} out:fade>
  {#each items as item, index}
    <li
      class="amazing-marvin-list-item"
      in:fly={{ x: 100, duration: 450, delay: 100 * index, easing: quintOut }}
      out:fade
    >
      <div class="amazing-marvin-title-container">
        {#if item.type}
          <Icon class="amazing-marvin-title-icon" data={ICONS[item.type]} style="fill: {item.color || 'white'}" />
        {/if}
        <div class="amazing-marvin-title" style="color: {(query.colorTitle && item.color) || undefined}">
          {@html convertHyperlinks(item.title).outerHTML}
        </div>
        {#if query.showLabel && item.labelIds}
          {#each item.labelIds as labelId}
            <div class="amazing-marvin-label" style="color: {labels[labelId].color}">
              {labels[labelId].title}
            </div>
          {/each}
        {/if}
      </div>
      {#if query.showNote && item.note && (note = getNote(item.note))}
        <blockquote class="amazing-marvin-note">
          {@html convertHyperlinks(note).outerHTML.replace(/\n/g, '<br /><br />')}
        </blockquote>
      {/if}
      {#each INHERIT_PROPS as prop}
        {#if item[prop] && item[prop].length > 0}
          <svelte:self {query} items={item[prop]} {labels} />
        {/if}
      {/each}
    </li>
  {/each}
</ul>
