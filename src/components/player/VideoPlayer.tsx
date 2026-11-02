"use client";

import { durationToSeconds, pad2 } from "@/lib/format";
import { kindGlyph, tones } from "@/lib/tones";
import { cn } from "@/lib/cn";
import type { Video } from "@/lib/types";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";
import { usePlayer } from "./PlayerProvider";

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${pad2(m)}:${pad2(Math.floor(seconds % 60))}`;
}

interface VideoPlayerProps {
  video: Video;
  labels: { play: string; pause: string; captions: string; seek: string };
}

/**
 * Player stage in the brand style. Playback is simulated by PlayerProvider;
 * replace the stage with a real <video> or embed when media is available.
 */
export function VideoPlayer({ video, labels }: VideoPlayerProps) {
  const player = usePlayer();
  const active = player.video?.id === video.id;
  const playing = active && player.playing;
  const position = active ? player.position : 0;
  const total = durationToSeconds(video.duration);
  const tone = tones[video.kind];

  const onPlay = () => (active ? player.toggle() : player.play(video.id));

  return (
    <div role="region" aria-label={video.title} className={cn("relative isolate aspect-video overflow-hidden rounded-[var(--radius-tile)]", tone.bg, tone.text)}>
      <OutlineNumeral value={video.episode ? pad2(video.episode) : kindGlyph[video.kind]} stroke={tone.stroke} strokeWidth="2px" className="-z-10 text-[min(48vw,520px)] opacity-60" />

      <button
        type="button"
        onClick={onPlay}
        aria-label={playing ? labels.pause : labels.play}
        className={cn(
          "absolute inset-0 m-auto grid size-20 place-items-center rounded-full bg-accent text-ink transition-transform hover:scale-105 md:size-24",
          !playing && "animate-pulse-ring",
        )}
      >
        {playing ? <PauseIcon size={30} /> : <PlayIcon size={30} />}
      </button>

      <div dir="ltr" className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/35 to-transparent px-4 pt-8 pb-3 font-latin text-xs md:px-6">
        <div className="flex justify-between">
          <span>
            {clock(position)} / {video.duration}
          </span>
          {video.captions && <span className="font-bold">CC · {labels.captions}</span>}
        </div>
        <input
          type="range"
          min={0}
          max={total}
          value={position}
          disabled={!active}
          onChange={(e) => player.seek(Number(e.target.value))}
          aria-label={labels.seek}
          className="h-1 w-full cursor-pointer accent-[var(--color-accent)]"
        />
      </div>
    </div>
  );
}
