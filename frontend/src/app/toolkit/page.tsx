'use client';

import React from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import MobileNav from '../../components/MobileNav';

export default function ToolkitPage() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-layout flex flex-col">
        <Header title="AI Teacher's Toolkit" />
        <div className="flex-1 p-8 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Teacher's Toolkit</h2>
            <p className="text-gray-500">This feature is coming soon.</p>
          </div>
        </div>
        <MobileNav showFab={false} />
      </main>
    </div>
  );
}
