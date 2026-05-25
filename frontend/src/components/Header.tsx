'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, ChevronDown, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
}

export default function Header({ title, showBack = false }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        {showBack ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => router.back()} 
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                color: 'var(--text-secondary)',
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
          </div>
        ) : (
          <>
            {/* Show page title on desktop */}
            <span className="header-title-desktop">{title}</span>
            
            {/* Show VedaAI Logo on mobile home screen */}
            <Link href="/" className="header-logo-mobile">
              <div className="logo-icon" style={{ width: '28px', height: '28px', fontSize: '14px' }}>V</div>
              <span className="logo-text" style={{ fontSize: '16px' }}>VedaAI</span>
            </Link>
          </>
        )}
      </div>
      <div className="top-nav-right">
        {/* Bell Icon */}
        <div className="bell-icon-container">
          <Bell size={18} />
          <div className="bell-dot"></div>
        </div>

        {/* User Card */}
        <div className="user-profile">
          <div className="user-avatar">JD</div>
          <span className="user-name" style={{ display: 'none' /* Hidden on small screens in Figma, but text hidden via CSS/JS check */ }}>John Doe</span>
          <ChevronDown size={14} color="var(--text-secondary)" className="header-title-desktop" />
        </div>

        {/* Hamburger Menu on Mobile */}
        <button className="menu-hamburger-mobile" onClick={() => alert('Mobile menu opened')}>
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
