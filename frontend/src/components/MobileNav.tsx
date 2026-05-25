'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  FileText, 
  Library, 
  Wrench, 
  Plus 
} from 'lucide-react';

interface MobileNavProps {
  showFab?: boolean;
}

export default function MobileNav({ showFab = false }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Assignments', icon: FileText, path: '/' }, // mapped to assignments dashboard
    { label: 'Library', icon: Library, path: '/library' },
    { label: 'AI Toolkit', icon: Wrench, path: '/toolkit' },
  ];

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {showFab && (
        <Link href="/create" style={{ textDecoration: 'none' }}>
          <div className="mobile-fab">
            <Plus size={24} />
          </div>
        </Link>
      )}

      {/* Bottom Nav Bar */}
      <div className="mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.label === 'Assignments' && pathname.startsWith('/assignment'));

          return (
            <Link key={item.label} href={item.path} style={{ textDecoration: 'none' }}>
              <div className={`mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
