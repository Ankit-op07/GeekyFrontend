// app/learn/[kitSlug]/sidebar-context.tsx
'use client';

import { createContext, useContext } from 'react';

interface SidebarTopic {
    _id: string;
    title: string;
    slug: string;
    order: number;
}

interface SidebarChapter {
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
}

export const SidebarContext = createContext<SidebarContextType>({
    kit: null, sidebar: [], allTopics: [],
});

export const useSidebarContext = () => useContext(SidebarContext);

export type { SidebarChapter, SidebarTopic, KitInfo, SidebarContextType };
