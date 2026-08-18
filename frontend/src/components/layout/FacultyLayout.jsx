import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { FacultyHeader } from './Navbar';

export const FacultyLayout = ({ children, title = 'Faculty Dashboard', activePath = '/dashboard' }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Persistent Sidebar */}
      <Sidebar
        activePath={activePath}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="lg:pl-60 flex-1 flex flex-col min-w-0 min-h-screen">
        <FacultyHeader
          title={title}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
