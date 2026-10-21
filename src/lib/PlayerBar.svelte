<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { player, toggle, seek, setVolume, next, prev, queueIdx, fmt } from "$lib/player.svelte";
  import { library } from "$lib/library.svelte";

  let scrubbing = $state(false);
  let scrubPos = $state(0);
  let shownPos = $derived(scrubbing ? scrubPos : player.pos);
  let idx = $derived(queueIdx());
  let current = $derived(library.tracks.find((t) => t.path === player.track));

  // cover for the playing track; cached per path so skipping back doesn't re-read the file
  const covers = new Map<string, string | null>();
  let cover = $state<string | null>(null);
  $effect(() => {
    const path = player.track;
    if (!path) return void (cover = null);
    if (covers.has(path)) return void (cover = covers.get(path)!);
    cover = null;
    invoke<string | null>("cover_art", { path }).then((c) => {
      covers.set(path, c);
      if (player.track === path) cover = c; // ignore if the track changed meanwhile
    });
  });
</script>

<footer>
  <button onclick={prev} disabled={idx <= 0}>⏮</button>
  <button onclick={toggle} disabled={!player.track}>
    {player.state === "playing" ? "⏸" : "▶"}
  </button>
  <button onclick={next} disabled={idx < 0 || idx >= player.queue.length - 1}
    >⏭</button
  >
  {#if cover}<img class="cover" src={cover} alt="" />{/if}
  <span class="title">{current?.title ?? "—"}</span>
  <input
    type="range"
    min="0"
    max={player.duration}
    step="0.5"
    value={shownPos}
    onpointerdown={() => {
      scrubPos = player.pos;
      scrubbing = true;
    }}
    oninput={(e) => (scrubPos = +e.currentTarget.value)}
    onchange={(e) => {
      seek(+e.currentTarget.value);
      scrubbing = false;
    }}
  />
  <span>{fmt(shownPos)} / {fmt(player.duration)}</span>
  <input
    type="range"
    min="0"
    max="1"
    step="0.01"
    value={player.volume}
    oninput={(e) => setVolume(+e.currentTarget.value)}
  />
</footer>

<style>
  footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 2rem 2rem;
    background: Canvas;
    border-top: 1px solid GrayText;
  }
  .cover {
    width: 5rem;
    height: 5rem;
    object-fit: cover;
    border-radius: 4px;
    flex: none;
  }
  .title {
    flex: 0 1 12rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  footer input[type="range"]:first-of-type {
    flex: 1;
  }
</style>
