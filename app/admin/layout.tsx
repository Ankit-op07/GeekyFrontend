// app/admin/layout.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
    BookOpen, Building2, Users, ShieldCheck, Menu, X,
    LayoutDashboard, ChevronRight
} from 'lucide-react';

const ADMIN_NAV = [
    { href: '/admin/content', label: 'Content', icon: BookOpen, desc: 'Manage kits & topics' },
    { href: '/admin/questions', label: 'Questions', icon: Building2, desc: 'Company-wise questions' },
    { href: '/admin/users', label: 'Users', icon: Users, desc: 'User management' },
    { href: '/admin/access', label: 'Access', icon: ShieldCheck, desc: 'Grant course access' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const SidebarContent = () => (
        <>
            {/* Logo / title */}
            <div className="px-4 py-5 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <LayoutDashboard className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-sm">Admin Panel</h2>
                        <p className="text-slate-500 text-[10px]">Geeky Frontend</p>
                    </div>
                </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {ADMIN_NAV.map(item => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${isActive
                                    ? 'bg-violet-500/15 text-violet-300 font-medium'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            <div className="flex-1 min-w-0">
                                <p className="truncate">{item.label}</p>
                            </div>
                            {isActive && <ChevronRight className="w-3.5 h-3.5 text-violet-500/50" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/5">
                <Link href="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                    ← Back to site
                </Link>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex flex-col w-56 border-r border-white/5 bg-[#0d0d14] fixed top-0 left-0 bottom-0 z-30">
                <SidebarContent />
            </aside>

            {/* Mobile top bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0d0d14]/95 backdrop-blur border-b border-white/5">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-white/5">
                        <Menu className="w-5 h-5 text-slate-400" />
                    </button>
                    <span className="text-white font-semibold text-sm">Admin Panel</span>
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {mobileOpen && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
                    <aside className="fixed top-0 left-0 bottom-0 w-56 bg-[#0d0d14] border-r border-white/5 z-50 md:hidden flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <span className="text-white font-semibold text-sm">Admin Panel</span>
                            <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-white/5">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <SidebarContent />
                    </aside>
                </>
            )}

            {/* Main content */}
            <main className="flex-1 md:ml-56 pt-14 md:pt-0 min-h-screen">
                {children}
            </main>
        </div>
    );
}
