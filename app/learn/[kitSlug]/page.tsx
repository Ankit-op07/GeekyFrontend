// app/learn/[kitSlug]/page.tsx
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSidebarContext } from "./sidebar-context";
import { Loader2, BookOpen } from "lucide-react";
import Link from "next/link";

/**
 * When user visits /learn/[kitSlug] without a topic,
 * redirect them to the last-read topic (if available)
 * or the first topic.
 */
export default function KitIndexPage() {
  const params = useParams();
  const router = useRouter();
  const { sidebar } = useSidebarContext();
  const kitSlug = params.kitSlug as string;

  useEffect(() => {
    if (sidebar.length === 0 || !sidebar.some(ch => ch.topics.length > 0)) return;

    // Check for last-read topic in localStorage
    let targetSlug: string | null = null;
    if (typeof window !== "undefined") {
      targetSlug = localStorage.getItem(`gf-last-topic-${kitSlug}`);
    }

    // Validate that the last-read topic still exists in the sidebar
    if (targetSlug) {
      const exists = sidebar.some(ch => ch.topics.some(t => t.slug === targetSlug));
      if (exists) {
        router.replace(`/learn/${kitSlug}/${targetSlug}`);
        return;
      }
    }

    // Fallback to first topic
    if (sidebar[0].topics.length > 0) {
      router.replace(`/learn/${kitSlug}/${sidebar[0].topics[0].slug}`);
    }
  }, [sidebar, kitSlug, router]);

  // Show while redirecting (or if no content)
  const hasContent = sidebar.some((ch) => ch.topics.length > 0);

  if (!hasContent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 text-lg mb-2">No content yet</p>
          <p className="text-slate-600 text-sm">
            Topics will appear once added via the admin panel
          </p>
          <Link
            href="/dashboard?tab=kits"
            className="mt-4 inline-block text-violet-400 text-sm hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
    </div>
  );
}
