<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import { play } from "$lib/player.svelte";
  import { library, load, type Track } from "$lib/library.svelte";

  let { open }: { open: boolean } = $props();

  let url = $state("");
  let downloading = $state(false);
  let dlError = $state<string | null>(null);
  let dlPct = $state<number | null>(null); // 0..1; null = not started, 1 = converting
  $effect(() => {
    const un = listen<number>("download_progress", (e) => (dlPct = Math.max(dlPct ?? 0, e.payload)));
    return () => void un.then((f) => f());
  });

  async function download() {
    const link = url.trim();
    if (!link || downloading) return;
    downloading = true;
    dlError = null;
    dlPct = null;
    try {
      const t = await invoke<Track>("download_audio", { url: link, dir: library.folder });
      if (library.folder) await load(library.folder); // sorted position + fresh tags; cache keeps it cheap
      else library.tracks = [t, ...library.tracks.filter((x) => x.path !== t.path)]; // no folder: nothing to scan
      url = "";
      await play(t.path, library.tracks.map((x) => x.path));
    } catch (e) {
      dlError = String(e); // the Rust command returns Err(String)
    } finally {
      downloading = false;
    }
  }
</script>

{#if open}
  <form
    class="download"
    onsubmit={(e) => {
      e.preventDefault();
      download();
    }}
  >
    <input
      type="url"
      placeholder="Paste a YouTube URL"
      bind:value={url}
      disabled={downloading}
    />
    <button type="submit" disabled={downloading || !url.trim()}>
      {downloading ? "Downloading…" : "Download audio"}
    </button>
  </form>
{/if}
{#if downloading}
  <div class="status" role="status">
    {#if dlPct !== null && dlPct < 1}
      <progress aria-label="Downloading" value={dlPct}></progress>
      <span>Downloading… {Math.round(dlPct * 100)}%</span>
    {:else}
      <progress aria-label="Working"></progress>
      <span>
        {dlPct === null
          ? "Fetching video info… (the first download also installs yt-dlp and ffmpeg)"
          : "Converting to m4a…"}
      </span>
    {/if}
  </div>
{/if}
{#if dlError}
  <div class="status error" role="alert">
    <span>{dlError}</span>
    <button onclick={() => (dlError = null)} aria-label="Dismiss">×</button>
  </div>
{/if}

<style>
  .download {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .download input {
    flex: 1;
  }
  .status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 6px 10px;
    margin-bottom: 0.75rem;
    border-radius: var(--r);
    background: var(--line);
  }
  .status progress {
    flex: none;
    width: 8rem;
    accent-color: var(--accent);
  }
  .status span {
    flex: 1;
  }
  .status.error {
    color: crimson;
  }
</style>
