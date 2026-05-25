'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAssignmentStore } from '../store/assignmentStore';
import { 
  Plus, 
  Home, 
  Users, 
  FileText, 
  Wrench, 
  Library, 
  Settings 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const assignments = useAssignmentStore((state) => state.assignments);

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'My Groups', icon: Users, path: '/groups' },
    { label: 'Assignments', icon: FileText, path: '/', badge: assignments.length },
    { label: "AI Teacher's Toolkit", icon: Wrench, path: '/toolkit' },
    { label: 'My Library', icon: Library, path: '/library' },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div className="logo-container">
          <div className="logo-icon">V</div>
          <span className="logo-text">VedaAI</span>
        </div>
      </Link>

      {/* Create Button */}
      <Link href="/create" style={{ textDecoration: 'none' }}>
        <button className="btn-create-assignment">
          <Plus size={16} />
          Create Assignment
        </button>
      </Link>

      {/* Nav List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.label === 'Assignments' && pathname.startsWith('/assignment'));
          
          return (
            <Link key={item.label} href={item.path} style={{ textDecoration: 'none' }}>
              <div className={`nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-item-content">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="badge-count">{item.badge}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Settings Tab */}
      <div style={{ marginBottom: '16px' }}>
        <Link href="/settings" style={{ textDecoration: 'none' }}>
          <div className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
            <div className="nav-item-content">
              <Settings size={18} />
              <span>Settings</span>
            </div>
          </div>
        </Link>
      </div>

      {/* School Profile Card */}
      <div className="school-profile-card">
        <div className="school-logo">🏫</div>
        <div className="school-info">
          <span className="school-name" title="Delhi Public School">Delhi Public School</span>
          <span className="school-loc">Bokaro Steel City</span>
        </div>
      </div>
    </aside>
  );
}
