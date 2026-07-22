"use client";

import { useEffect, useState } from "react";
import { BookOpen, Play, ExternalLink, Youtube, Sparkles, ChevronDown } from "lucide-react";
import { getTopicReferences, hasCuratedReferences, type RefLink } from "@/lib/topic-references";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function ArticleRow({ link }: { link: RefLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-xl border border-reader-border bg-reader-surface p-3 transition-all hover:border-reader-accent-soft-border hover:bg-reader-surface-hover"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-reader-accent-soft">
        <BookOpen className="h-4 w-4 text-reader-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-reader-text group-hover:text-reader-accent-hover">
          {link.title}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-reader-faint">
          {link.source || hostOf(link.url)}
          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </p>
      </div>
    </a>
  );
}

function VideoRow({ link }: { link: RefLink }) {
  const [thumbOk, setThumbOk] = useState(true);
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-reader-border bg-reader-surface p-2.5 transition-all hover:border-reader-accent-soft-border hover:bg-reader-surface-hover"
    >
      <div className="relative flex h-[52px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-red-500/90 to-rose-600/90">
        {link.videoId && thumbOk && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://i.ytimg.com/vi/${link.videoId}/mqdefault.jpg`}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setThumbOk(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm transition-transform group-hover:scale-110">
          <Play className="h-3.5 w-3.5 translate-x-[1px] fill-white text-white" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-reader-text group-hover:text-reader-accent-hover">
          {link.title}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-reader-faint">
          <Youtube className="h-3 w-3" /> {link.channel || "YouTube"}
        </p>
      </div>
    </a>
  );
}

export function TopicReferences({
  slug,
  title,
  kitName,
  className = "",
}: {
  slug: string;
  title: string;
  kitName?: string;
  className?: string;
}) {
  const refs = getTopicReferences(slug, title, kitName);
  const curated = hasCuratedReferences(slug);

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("gf-refs-collapsed") === "1");
    } catch {
      /* localStorage may be unavailable (privacy mode) — keep default */
    }
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("gf-refs-collapsed", next ? "1" : "0");
      } catch {
        /* non-critical */
      }
      return next;
    });
  };

  return (
    <div className={className}>
      <button
        onClick={toggle}
        aria-expanded={!collapsed}
        className="mb-4 flex w-full items-center gap-2 text-left"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-reader-accent" />
        <h3 className="flex-1 text-sm font-semibold uppercase tracking-wide text-reader-heading">
          Learn more
        </h3>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-reader-faint transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {!collapsed && (
        <>
          {refs.articles.length > 0 && (
            <section className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-reader-faint">
                Articles &amp; docs
              </p>
              <div className="flex flex-col gap-2">
                {refs.articles.map((link) => (
                  <ArticleRow key={link.url} link={link} />
                ))}
              </div>
            </section>
          )}

          {refs.videos.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-reader-faint">
                Videos
              </p>
              <div className="flex flex-col gap-2">
                {refs.videos.map((link) => (
                  <VideoRow key={link.url} link={link} />
                ))}
              </div>
            </section>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-reader-faint">
            {curated
              ? "Hand-picked references for this lesson."
              : "Suggested searches for this lesson — opens in a new tab."}
          </p>
        </>
      )}
    </div>
  );
}
