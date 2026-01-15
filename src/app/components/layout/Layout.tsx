import { ReactNode, useEffect } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useApp } from '@/app/context/AppContext';

export function Layout({ children }: { children: ReactNode }) {
  const { user, isSidebarCollapsed, currentPage, setCurrentPage } = useApp();

  // Fullscreen Mode Logic
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentPage === 'pos-fullscreen') {
        setCurrentPage('pos');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [currentPage, setCurrentPage]);

  if (!user) {
    return <>{children}</>;
  }

  // Render Fullscreen (No Sidebar/TopBar)
  if (currentPage === 'pos-fullscreen') {
    return (
      <div className="relative min-h-screen bg-muted/30 p-4">
        {children}
        <button
          onClick={() => setCurrentPage('pos')}
          className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-black hover:opacity-100 active:scale-95 opacity-60"
          title="Exit Fullscreen (ESC)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minimize-2"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" x2="21" y1="10" y2="3" /><line x1="3" x2="10" y1="21" y2="14" /></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Sidebar />
      <main
        className="mt-10 min-h-[calc(100vh-4rem)] p-6 transition-all duration-300"
        style={{ marginLeft: isSidebarCollapsed ? 80 : 260 }}
      >
        <div className="mx-auto max-w-[1280px]">
          {children}
        </div>
      </main>
    </div>
  );
}
