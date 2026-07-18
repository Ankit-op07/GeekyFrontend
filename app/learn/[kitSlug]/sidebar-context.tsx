// app/learn/[kitSlug]/sidebar-context.tsx
'use client';

import { createContext, useContext } from 'react';

interface SidebarTopic {
    _id: string;
    title: string;
    slug: string;
    order: number;
}

export interface SidebarChapter {
    _id: string;
    title: string;
    slug: string;
    topics: SidebarTopic[];
}

interface KitInfo {
    _id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
    description: string;
}

interface SidebarContextType {
    kit: KitInfo | null;
    sidebar: SidebarChapter[];
    allTopics: { slug: string; title: string; chapterTitle: string }[];
    /** True when the logged-in user doesn't own this kit — only chapter 1 is accessible */
    isPreview: boolean;
    /** The _id (string) of the first chapter, used to gate topic access */
    firstChapterId: string | null;
    /** Bookmarked topic slugs in THIS kit (the layout hydrates + owns this). */
    bookmarks: Set<string>;
    /** Optimistically toggle a bookmark for a topic in this kit and persist it. */
    toggleBookmark: (topicSlug: string, title: string, chapterTitle?: string) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
    kit: null, sidebar: [], allTopics: [], isPreview: false, firstChapterId: null,
    bookmarks: new Set(), toggleBookmark: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);

export type { SidebarTopic, KitInfo, SidebarContextType };
