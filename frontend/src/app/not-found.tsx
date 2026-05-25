'use client';

import React from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MobileNav from '../components/MobileNav';
import { Wrench } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="app-container">
      {/* Reusable Left Sidebar */}
      <Sidebar />

      {/* Main Layout Area */}
      <main className="main-layout">
        <Header title="Feature Coming Soon" />

        <div className="content-body">
          <div className="empty-state animate-fade-in">
            <div className="empty-illustration-container" style={{ backgroundColor: '#F1F5F9', border: 'none' }}>
              <Wrench size={48} color="var(--text-secondary)" />
            </div>
            <h2 className="empty-title">Feature Under Construction</h2>
            <p className="empty-desc">
              This module is currently being finalized. You can configure curriculum details, 
              run AI generations, and print structured papers inside the Assignments workspace.
            </p>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button className="btn-primary">
                Back to Assignments
              </button>
            </Link>
          </div>
        </div>

        {/* Mobile bottom nav bar */}
        <MobileNav showFab={false} />
      </main>
    </div>
  );
}
