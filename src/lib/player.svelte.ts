import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

type PlayState = "playing" | "paused" | "stopped";

export const player = $state({
  track: null as string | null,
  state: "stopped" as PlayState,
  pos: 0,
  duration: 0,
  volume: 1,
  queue: [] as string[], // paths of the list the track was played from; next/prev walk this, not the current view
});

listen<string>("track_changed", (e) => {
  player.track = e.payload;
  player.pos = 0;
});
listen<PlayState>("state_changed", (e) => (player.state = e.payload));
listen<[number, number]>("position", (e) => ([player.pos, player.duration] = e.payload));
listen("track_ended", () => {
  player.state = "stopped";
  player.pos = 0;
  next();
});

export const play = (path: string, queue?: string[]) => {
  if (queue) player.queue = queue;
  return invoke("play", { path });
};
export const queueIdx = () => player.queue.indexOf(player.track ?? "");
export const next = () => {
  const i = queueIdx();
  if (i >= 0 && i < player.queue.length - 1) play(player.queue[i + 1]);
};
export const prev = () => {
  const i = queueIdx();
  if (i > 0) play(player.queue[i - 1]);
};
export const toggle = () => invoke(player.state === "playing" ? "pause" : "resume");
export const seek = (secs: number) => {
  player.pos = Math.max(0, secs); // optimistic; Rust confirms on next tick
  return invoke("seek", { secs });
};
export const setVolume = (vol: number) => {
  player.volume = vol;
  invoke("set_volume", { vol });
};

export const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
