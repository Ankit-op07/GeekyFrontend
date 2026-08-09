"use client"

import { useState } from "react"
import { Play, ExternalLink } from "lucide-react"
import { videoEmbedUrl, videoPosterUrl } from "@/lib/dsa/types"

/**
 * Click-to-play YouTube embed.
 *
 * WHY NOT JUST AN <iframe>
 * ------------------------
 * A YouTube iframe pulls ~1MB of player JavaScript and opens several
 * connections BEFORE anyone presses play. On a section page with a video per
 * problem that is tens of megabytes and a frozen tab — and our audience is
 * largely on mobile data. So the default state is an <img> poster (~15KB) and
 * the real iframe is mounted only on click, at which point `autoplay=1` means
 * the user's single click still starts the video.
 *
 * `youtube-nocookie.com` is used for the embed: same player, no tracking cookie
 * until the user actually plays something.
 */
export function YoutubeEmbed({
    videoId,
    title,
    /** Shown when we have no verified video id — see the fallback note below. */
    searchUrl,
}: {
    videoId?: string | null
    title: string
    searchUrl: string
}) {
    const [playing, setPlaying] = useState(false)

    /**
     * No verified id → we send the learner to a YouTube SEARCH rather than
     * guessing a watch URL.
     *
     * This is deliberate and it is not laziness: an 11-character video id that
     * is close-but-wrong embeds a confidently-playing video about a different
     * problem, and the learner assumes they misunderstood the question. A
     * search is visibly a search — it cannot mislead, and it still gets them
     * there in one click.
     */
    if (!videoId) {
        return (
            <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-reader-border bg-reader-surface px-4 py-3 text-sm text-reader-muted transition-colors hover:border-reader-accent hover:text-reader-accent"
            >
                <span className="flex items-center gap-2">
                    <Play className="h-4 w-4 flex-shrink-0" />
                    Find a video walkthrough for “{title}”
                </span>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            </a>
        )
    }

    if (!playing) {
        return (
            <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Play video solution for ${title}`}
                className="group relative block w-full overflow-hidden rounded-xl border border-reader-border bg-reader-code focus:outline-none focus-visible:ring-2 focus-visible:ring-reader-accent"
                style={{ aspectRatio: "16 / 9" }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- i.ytimg.com
                    is not in next.config images.domains, and adding a remote host
                    to the optimizer for a thumbnail we already size ourselves buys
                    nothing. */}
                <img
                    src={videoPosterUrl(videoId)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110">
                        <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
                    </span>
                </span>
            </button>
        )
    }

    return (
        <div
            className="overflow-hidden rounded-xl border border-reader-border bg-black"
            style={{ aspectRatio: "16 / 9" }}
        >
            <iframe
                src={`${videoEmbedUrl(videoId)}&autoplay=1`}
                title={`Video solution — ${title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
            />
        </div>
    )
}
