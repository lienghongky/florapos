import { ReactNode, useEffect, useState } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useApp } from '@/app/context/AppContext';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isDesktop;
}

export function Layout({ children }: { children: ReactNode }) {
  const {
    user,
    isSidebarCollapsed,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    currentPage,
    setCurrentPage,
  } = useApp();

  const isDesktop = useIsDesktop();

  // Fullscreen Mode — ESC exits
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentPage === 'pos-fullscreen') {
        setCurrentPage('pos');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [currentPage, setCurrentPage]);

  // Auto-close mobile sidebar on resize to desktop
  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop, setMobileSidebarOpen]);

  if (!user) return <>{children}</>;

  // Fullscreen POS — no chrome
  if (currentPage === 'pos-fullscreen') {
    return (
      <div className="relative min-h-screen bg-muted/30 p-4">
        {children}
        <button
          onClick={() => setCurrentPage('pos')}
          className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-black opacity-60 hover:opacity-100 active:scale-95"
          title="Exit Fullscreen (ESC)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" x2="21" y1="10" y2="3" /><line x1="3" x2="10" y1="21" y2="14" /></svg>
        </button>
      </div>
    );
  }

  const mainMarginLeft = isDesktop ? (isSidebarCollapsed ? 80 : 260) : 0;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Sidebar />

      {/* Mobile backdrop — closes sidebar when tapped outside */}
      {isMobileSidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <main
        className="mt-16 min-h-[calc(100vh-4rem)] p-4 md:p-6 transition-all duration-300"
        style={{ marginLeft: mainMarginLeft }}
      >
        <div className="mx-auto max-w-[1280px]">
          {children}
        </div>
      </main>
    </div>
  );
}
