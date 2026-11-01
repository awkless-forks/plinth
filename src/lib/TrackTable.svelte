<script lang="ts">
  import { player, play, fmt } from "$lib/player.svelte";
  import { artistOf, type Track } from "$lib/library.svelte";
  import { reorder } from "$lib/reorder";
  import AudioLines from "@lucide/svelte/icons/audio-lines";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";

  let {
    tracks,
    empty = "No tracks.",
    onmenu,
    onmove,
  }: {
    tracks: Track[];
    empty?: string;
    onmenu?: (t: Track, index: number) => void;
    onmove?: (from: number, to: number) => void; // set = playlist: ≡ handles, row numbers instead of track numbers
  } = $props();

  let paths = $derived(tracks.map((t) => t.path));
  // a right-click (or ctrl-click) can also fire a click, which played the song;
  // skip clicks until the next real pointer press or key press
  let menued = false;
</script>

<div class="row head" class:handles={onmove}>
  <span class="num">#</span><span>Title</span><span>Artist</span><span>Album</span><span class="num">Year</span><span class="num">Time</span>
</div>
<!-- keyed by index: a playlist can hold the same path twice -->
{#each tracks as t, i (onmove ? i : t.path)}
  <div class="item" data-item>
    {#if onmove}
      <button class="handle" aria-label="Move {t.title} (Alt+Up/Down)" use:reorder={{ index: i, count: tracks.length, onmove }}
        ><GripVertical size={16} /></button
      >
    {/if}
    <button
      class="row"
      class:active={t.path === player.track}
      onpointerdown={(e) => (menued = e.button !== 0 || e.ctrlKey)}
      onkeydown={() => (menued = false)}
      onclick={() => !menued && play(t.path, paths, i)}
      oncontextmenu={(e) => {
        menued = true;
        if (!onmenu) return;
        e.preventDefault();
        onmenu(t, i);
      }}
    >
      <span class="num">
        {#if player.state === "playing" && t.path === player.track}<AudioLines size={14} aria-label="Playing" />{:else}{onmove
            ? i + 1
            : (t.track_no ?? i + 1)}{/if}
      </span>
      <span class="cell id">{t.title}</span>
      <span class="cell">{t.artist ?? artistOf(t)}</span>
      <span class="cell">{t.album ?? "—"}</span>
      <span class="num">{t.year ?? "—"}</span>
      <span class="num">{t.secs ? fmt(t.secs) : "—"}</span>
    </button>
  </div>
{:else}
  <p class="empty">{empty}</p>
{/each}

<style>
  .item {
    display: flex;
  }
  .handle {
    all: unset;
    flex: none;
    display: grid;
    place-items: center;
    width: 1.5rem;
    color: var(--faint);
    cursor: grab;
    touch-action: none; /* keep pointer drags from scrolling the list */
    user-select: none;
  }
  .handles {
    padding-left: calc(1.5rem + 12px);
  }
</style>
