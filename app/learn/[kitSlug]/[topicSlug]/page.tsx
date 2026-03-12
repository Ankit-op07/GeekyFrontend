// app/learn/[kitSlug]/[topicSlug]/page.tsx
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { useSidebarContext } from "../sidebar-context";
import parse, { Element } from "html-react-parser";
import { marked } from "marked";
import { CodeBlock } from "@/components/learn/code-block";
import "highlight.js/styles/atom-one-dark.css";

// ── localStorage helpers for progress tracking ──
function getLastTopic(kitSlug: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`gf-last-topic-${kitSlug}`);
}

function setLastTopic(kitSlug: string, topicSlug: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`gf-last-topic-${kitSlug}`, topicSlug);
  }
}

function getCompletedTopics(kitSlug: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`gf-completed-${kitSlug}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCompletedTopics(kitSlug: string, completed: Set<string>) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`gf-completed-${kitSlug}`, JSON.stringify([...completed]));
  }
}

export default function TopicPage() {
  const params = useParams();
  const kitSlug = params.kitSlug as string;
  const topicSlug = params.topicSlug as string;
  const { allTopics } = useSidebarContext();

  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [readProgress, setReadProgress] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(() => getCompletedTopics(kitSlug));
  const articleRef = useRef<HTMLDivElement>(null);

  // Fetch topic content
  useEffect(() => {
    setLoading(true);
    setReadProgress(0);
    fetch(`/api/learn/kits/${kitSlug}/${topicSlug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.topic) setTopic(d.topic);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [kitSlug, topicSlug]);

  // Remember last viewed topic
  useEffect(() => {
    if (topicSlug) {
      setLastTopic(kitSlug, topicSlug);
    }
  }, [kitSlug, topicSlug]);

  // Reading progress scroll tracker
  const handleScroll = useCallback(() => {
    if (!articleRef.current) return;
    const el = articleRef.current;
    const rect = el.getBoundingClientRect();
    const totalHeight = el.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) {
      setReadProgress(100);
      return;
    }
    const scrolled = -rect.top;
    const pct = Math.min(100, Math.max(0, Math.round((scrolled / totalHeight) * 100)));
    setReadProgress(pct);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial calc
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, topic]);

  // Mark/unmark topic as completed
  const toggleCompleted = useCallback(() => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(topicSlug)) next.delete(topicSlug);
      else next.add(topicSlug);
      saveCompletedTopics(kitSlug, next);
      return next;
    });
  }, [kitSlug, topicSlug]);

  // Prev / Next
  const currentIdx = allTopics.findIndex((t) => t.slug === topicSlug);
  const prevTopic = currentIdx > 0 ? allTopics[currentIdx - 1] : null;
  const nextTopic = currentIdx < allTopics.length - 1 ? allTopics[currentIdx + 1] : null;

  // Kit-level progress
  const totalTopics = allTopics.length;
  const completedCount = allTopics.filter(t => completed.has(t.slug)).length;
  const kitProgress = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  // Convert content to well-formed HTML
  // Two sources: (1) TipTap rich editor → saves HTML with tags like <h1>, <p>, <pre>
  //              (2) Seed script / raw input → saves markdown text
  const htmlContent = useMemo(() => {
    if (!topic?.content) return "";
    let raw = topic.content;

    // Unescape escaped newlines from seed data
    raw = raw.replace(/\\n/g, "\n").replace(/\\'/g, "'");

    // Detect if the content is HTML (from TipTap) or markdown
    // TipTap HTML always starts with a block tag like <h1>, <h2>, <p>, <pre>, <ul>, <ol>, <blockquote>
    const trimmed = raw.trim();
    const isHtml = /^<(h[1-6]|p|div|pre|ul|ol|blockquote|table|section|article|figure|hr)[\s>]/i.test(trimmed);

    if (isHtml) {
      // Already HTML from TipTap — use as-is
      return raw;
    }

    // Strip duplicate H1 title if it matches the topic title
    // Example: "# MongoDB with Mongoose\n\nContent..." -> "\n\nContent..."
    const titleRegex = new RegExp(`^#\\s+${topic.title.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, '\\$&')}\\s*\\n+`, 'i');
    raw = raw.replace(titleRegex, "");

    // Parse as markdown → HTML
    return marked.parse(raw, { breaks: true, gfm: true }) as string;
  }, [topic]);

  // Reading time estimate (strip HTML for word count)
  const readingTime = useMemo(() => {
    if (!htmlContent) return 0;
    const text = htmlContent.replace(/<[^>]*>/g, " ");
    return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
  }, [htmlContent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-2">Topic not found</p>
          <Link
            href={`/learn/${kitSlug}`}
            className="text-violet-400 text-sm hover:underline"
          >
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Fixed reading progress bar at top ── */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:left-72">
        <div className="h-[3px] bg-white/5 w-full">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-150 ease-out"
            style={{ width: `${readProgress}%` }}
          />
        </div>
      </div>

      <div ref={articleRef} className="max-w-3xl mx-auto px-6 py-10 lg:py-12">
        {/* Kit progress bar */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-300"
              style={{ width: `${kitProgress}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            {completedCount}/{totalTopics} topics
          </span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            {topic.title}
          </h1>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {readingTime} min read
              </span>
              {topic.updatedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Updated{" "}
                  {new Date(topic.updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-600">
                Topic {currentIdx + 1} of {totalTopics}
              </span>
            </div>

            <button
              onClick={toggleCompleted}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                completed.has(topicSlug)
                  ? "bg-green-500/15 text-green-400 border border-green-500/20"
                  : "bg-white/5 text-slate-500 border border-white/10 hover:bg-white/10 hover:text-slate-300"
              }`}
              title={completed.has(topicSlug) ? "Mark as incomplete" : "Mark as completed"}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {completed.has(topicSlug) ? "Completed" : "Mark done"}
            </button>
          </div>
        </div>

        {/* Rendered Content */}
        <article className="topic-content">
          {htmlContent ? (
            parse(htmlContent, {
              replace: (domNode) => {
                if (domNode instanceof Element && domNode.name === "pre") {
                  // Extract raw text from nested nodes
                  const extractText = (node: any): string => {
                    if (node.type === "text") return node.data || "";
                    if (node.children)
                      return node.children.map(extractText).join("");
                    return "";
                  };
                  const code = extractText(domNode);

                  // Try to detect language from class attribute
                  let language = "javascript";
                  const codeEl = domNode.children?.find(
                    (c: any) => c.name === "code"
                  ) as Element | undefined;
                  if (codeEl) {
                    const cls = codeEl.attribs?.class || "";
                    const match = cls.match(/language-(\w+)/);
                    if (match) language = match[1];
                  }

                  return <CodeBlock code={code} language={language} />;
                }
              },
            })
          ) : (
            <p className="text-slate-500 italic">
              This topic has no content yet.
            </p>
          )}
        </article>

        {/* Prev / Next */}
        <div className="mt-16 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevTopic ? (
            <Link
              href={`/learn/${kitSlug}/${prevTopic.slug}`}
              className="group p-4 rounded-xl border border-white/5 hover:border-violet-500/30 hover:bg-white/3 transition-all text-left"
            >
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <ChevronLeft className="w-3 h-3" /> Previous
              </div>
              <p className="text-sm text-slate-300 group-hover:text-violet-300 transition-colors font-medium">
                {prevTopic.title}
              </p>
            </Link>
          ) : (
            <div />
          )}

          {nextTopic && (
            <Link
              href={`/learn/${kitSlug}/${nextTopic.slug}`}
              className="group p-4 rounded-xl border border-white/5 hover:border-violet-500/30 hover:bg-white/3 transition-all text-right ml-auto"
            >
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 justify-end">
                Next <ChevronRight className="w-3 h-3" />
              </div>
              <p className="text-sm text-slate-300 group-hover:text-violet-300 transition-colors font-medium">
                {nextTopic.title}
              </p>
            </Link>
          )}
        </div>

        {/* Reader Styles */}
        <style jsx global>{`
          .topic-content {
            color: #cbd5e1;
            font-size: 16px;
            line-height: 1.85;
            word-wrap: break-word;
          }
          .topic-content h1 {
            font-size: 1.875rem;
            font-weight: 700;
            color: #fff;
            margin: 2.5rem 0 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            line-height: 1.3;
          }
          .topic-content h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #fff;
            margin: 2rem 0 0.6rem;
            line-height: 1.35;
          }
          .topic-content h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #e2e8f0;
            margin: 1.75rem 0 0.5rem;
            line-height: 1.4;
          }
          .topic-content h4 {
            font-size: 1.1rem;
            font-weight: 600;
            color: #e2e8f0;
            margin: 1.5rem 0 0.4rem;
          }
          .topic-content p {
            margin: 0.85rem 0;
          }
          .topic-content strong {
            color: #fff;
            font-weight: 600;
          }
          .topic-content em {
            font-style: italic;
            color: #94a3b8;
          }
          .topic-content u {
            text-decoration: underline;
            text-underline-offset: 3px;
          }
          .topic-content s {
            text-decoration: line-through;
            opacity: 0.6;
          }
          .topic-content a {
            color: #a78bfa;
            text-decoration: none;
            border-bottom: 1px solid rgba(167, 139, 250, 0.3);
            transition: all 0.2s;
          }
          .topic-content a:hover {
            color: #c4b5fd;
            border-bottom-color: #c4b5fd;
          }
          .topic-content code {
            background: rgba(139, 92, 246, 0.12);
            color: #c4b5fd;
            padding: 0.15rem 0.45rem;
            border-radius: 0.3rem;
            font-size: 0.88em;
            font-family:
              "Fira Code", "JetBrains Mono", "Cascadia Code", monospace;
            border: 1px solid rgba(139, 92, 246, 0.1);
          }
          /* Code inside our highlighted CodeBlock should NOT have inline styles */
          .topic-content pre code {
            background: none !important;
            color: inherit;
            padding: 0;
            border: none;
            font-size: 0.875rem;
            line-height: 1.65;
          }
          .topic-content pre {
            background: #0d0d1a !important;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 0.75rem;
            padding: 1.25rem 1.5rem;
            margin: 0;
            overflow-x: auto;
          }
          .topic-content ul {
            list-style-type: none;
            padding-left: 0;
            margin: 0.85rem 0;
          }
          .topic-content ul li {
            position: relative;
            padding-left: 1.5rem;
            margin: 0.4rem 0;
          }
          .topic-content ul li::before {
            content: "▸";
            position: absolute;
            left: 0;
            color: #8b5cf6;
            font-weight: 600;
          }
          .topic-content ol {
            list-style: none;
            padding-left: 0;
            margin: 0.85rem 0;
            counter-reset: item;
          }
          .topic-content ol li {
            position: relative;
            padding-left: 2rem;
            margin: 0.4rem 0;
            counter-increment: item;
          }
          .topic-content ol li::before {
            content: counter(item);
            position: absolute;
            left: 0;
            width: 1.35rem;
            height: 1.35rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(139, 92, 246, 0.12);
            color: #a78bfa;
            border-radius: 50%;
            font-size: 0.7rem;
            font-weight: 700;
            top: 0.25rem;
          }
          .topic-content blockquote {
            border-left: 3px solid #8b5cf6;
            background: rgba(139, 92, 246, 0.06);
            padding: 1rem 1.25rem;
            border-radius: 0 0.75rem 0.75rem 0;
            margin: 1.25rem 0;
            color: #94a3b8;
          }
          .topic-content blockquote p {
            margin: 0.25rem 0;
          }
          .topic-content blockquote strong {
            color: #a78bfa;
          }
          .topic-content hr {
            border: none;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            margin: 2.5rem 0;
          }
          .topic-content img {
            max-width: 100%;
            height: auto;
            display: block;
            border-radius: 0.75rem;
            border: 1px solid rgba(255, 255, 255, 0.06);
            margin: 1.5rem auto;
          }
          .topic-content table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 1.25rem 0;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 0.75rem;
            overflow-x: auto;
            display: block;
            white-space: nowrap;
          }
          .topic-content th {
            background: rgba(139, 92, 246, 0.08);
            color: #e2e8f0;
            font-weight: 600;
            padding: 0.75rem 1rem;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            font-size: 0.875rem;
          }
          .topic-content td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            font-size: 0.875rem;
          }
          .topic-content tr:last-child td {
            border-bottom: none;
          }
          .topic-content tr:hover td {
            background: rgba(255, 255, 255, 0.02);
          }

          /* highlight.js overrides for dark theme consistency */
          .hljs {
            background: transparent !important;
            padding: 0 !important;
          }
        `}</style>
      </div>
    </>
  );
}
