<script lang="ts">
  import Shuffle from "@lucide/svelte/icons/shuffle";
  import Undo2 from "@lucide/svelte/icons/undo-2";
  import Play from "@lucide/svelte/icons/play";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import {
    player,
    playAt,
    playQueued,
    replay,
    moveInQueue,
    moveInContext,
    clearQueue,
    toggleShuffle,
    undoQueue,
  } from "$lib/player.svelte";
  import { library } from "$lib/library.svelte";
  import { add, addTracks } from "$lib/playlists.svelte";
  import { reorder } from "$lib/reorder";

  let { onclose }: { onclose: () => void } = $props();

  let byPath = $derived(new Map(library.tracks.map((t) => [t.path, t])));
  const title = (path: string) => byPath.get(path)?.title ?? path.split(/[\\/]/).pop();
  let rest = $derived(player.context.slice(player.at + 1)); // what plays after the queue is empty
  // absolute context index of row k in the "next from" list
  const abs = (k: number) => player.at + 1 + k;

  function saveAsPlaylist() {
    const id = add();
    if (id) addTracks(id, [...(player.track ? [player.track] : []), ...player.queue, ...rest]);
  }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onclose()} />

<section class="queue" aria-label="Queue">
  <header>
    <h2>Up next</h2>
    <button
      class="icon"
      class:on={player.shuffle}
      aria-pressed={player.shuffle}
      aria-label="Shuffle"
      onclick={toggleShuffle}
      {@attach (el: HTMLButtonElement) => el.focus()}><Shuffle size={18} /></button
    >
    <button class="icon" aria-label="Undo last queue change" disabled={!player.canUndo} onclick={undoQueue}
      ><Undo2 size={18} /></button
    >
  </header>

  <!-- opens scrolled to the current track: scroll up for history, down for what's next -->
  <div class="lists">
    {#if player.history.length}
      <h3>Recently played</h3>
      <ol>
        {#each player.history as path, k (k)}
          <li><button class="track past" onclick={() => replay(path)}><span class="cell">{title(path)}</span></button></li>
        {/each}
      </ol>
    {/if}

    {#if player.track}
      <h3>Now playing</h3>
      <p
        class="current"
        aria-current="true"
        {@attach (el: HTMLElement) => {
          // put the "Now playing" heading at the top of the scroll box
          const box = el.parentElement!;
          box.scrollTop = el.previousElementSibling!.getBoundingClientRect().top - box.getBoundingClientRect().top;
        }}
      >
        <span class="mark"><Play size={14} fill="currentColor" /></span>
        <span class="cell">{title(player.track)}</span>
      </p>
    {/if}

    {#if player.queue.length}
      <h3>Next in queue</h3>
      <!-- keyed by index: the same song can be queued twice -->
      <ol>
        {#each player.queue as path, k (k)}
          <li data-item>
            <button
              class="handle"
              aria-label="Move {title(path)} (Alt+Up/Down)"
              use:reorder={{ index: k, count: player.queue.length, onmove: moveInQueue }}
              ><GripVertical size={16} /></button
            >
            <button class="track" onclick={() => playQueued(k)}><span class="cell">{title(path)}</span></button>
          </li>
        {/each}
      </ol>
    {/if}

    {#if rest.length}
      <h3>Next from list</h3>
      <ol>
        {#each rest as path, k (k)}
          <li data-item>
            <button
              class="handle"
              aria-label="Move {title(path)} (Alt+Up/Down)"
              use:reorder={{ index: k, count: rest.length, onmove: (f, t) => moveInContext(abs(f), abs(t)) }}
              ><GripVertical size={16} /></button
            >
            <button class="track" onclick={() => playAt(abs(k))}><span class="cell">{title(path)}</span></button>
          </li>
        {/each}
      </ol>
    {/if}

    {#if !player.queue.length && !rest.length}
      <p class="empty">Nothing up next. Right-click a track and choose Add to queue.</p>
    {/if}
  </div>

  <footer>
    <button class="link" onclick={clearQueue} disabled={!player.queue.length}>Clear queue</button>
    <button class="link" onclick={saveAsPlaylist} disabled={!player.track && !player.queue.length && !rest.length}
      >Save as playlist</button
    >
  </footer>
</section>

<style>
  .queue {
    position: absolute;
    right: 0;
    bottom: calc(100% + 0.75rem);
    width: 22rem;
    height: min(24rem, 60vh); /* fixed size; the lists scroll inside */
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: 2px solid var(--text);
    border-radius: var(--r);
    box-shadow: 0 8px 24px #0003;
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: var(--line);
    border-bottom: 2px solid var(--text);
  }
  h2 {
    flex: 1;
    margin: 0;
    font-size: 1.1rem;
  }
  .lists {
    flex: 1;
    min-height: 0;
    padding: 0.5rem;
    overflow: auto;
  }
  .past {
    padding-left: 2rem;
    opacity: 0.6;
  }
  h3 {
    margin: 0.75rem 0 0.25rem;
    font-size: 0.85rem;
    opacity: 0.6;
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li,
  .current {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-height: 2rem;
  }
  .current {
    background: color-mix(in srgb, var(--accent) 25%, transparent);
    border-radius: var(--r);
    font-weight: 600;
  }
  .mark {
    display: grid;
    place-items: center;
    width: 1.75rem;
    color: var(--accent);
  }
  .handle {
    all: unset;
    display: grid;
    place-items: center;
    width: 1.75rem;
    height: 1.75rem;
    cursor: grab;
    opacity: 0.6;
    touch-action: none; /* keep pointer drags from scrolling the list */
    user-select: none;
  }
  .track {
    all: unset;
    flex: 1;
    min-width: 0;
    padding: 0.25rem;
    border-radius: var(--r);
    cursor: pointer;
  }
  .track:hover {
    background: var(--line);
  }
  .empty {
    padding: 0.5rem;
    opacity: 0.6;
  }
  footer {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-top: 1px solid var(--line);
  }
  .link {
    all: unset;
    cursor: pointer;
    text-decoration: underline;
  }
  .link:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .icon {
    width: 2rem;
    height: 2rem;
  }
</style>
