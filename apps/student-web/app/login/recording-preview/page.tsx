"use client";

import { RecordingPlayer } from "@/components/recording/recording-player";

const TEST_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export default function RecordingPlayerPreviewPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-xl font-bold">
          iPhone Recording Player Test
        </h1>

        <RecordingPlayer
          playbackUrl={TEST_VIDEO_URL}
          status="ready"
          durationSeconds={30}
          isLoading={false}
          isSeekable={false}
          title="iPhone fullscreen test"
        />
      </div>
    </main>
  );
}