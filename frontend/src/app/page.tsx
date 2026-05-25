'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MobileNav from '../components/MobileNav';
import { useAssignmentStore, Assignment } from '../store/assignmentStore';
import { 
  Plus, 
  FileText, 
  Search, 
  SlidersHorizontal, 
  MoreVertical, 
  Eye, 
  Trash2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

export default function Dashboard() {
  const { 
    assignments, 
    fetchAssignments, 
    deleteAssignment, 
    isLoading 
  } = useAssignmentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Close card menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this assignment?')) {
      await deleteAssignment(id);
    }
    setActiveMenuId(null);
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Filter assignments by search query
  const filteredAssignments = assignments.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="main-layout">
        <Header title="Assignment" />

        <div className="content-body">
          {isLoading && assignments.length === 0 ? (
            <div className="skeleton-loader animate-fade-in">
              <div className="spinner"></div>
              <p className="skeleton-title">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            /* 0 STATE */
            <div className="empty-state animate-fade-in">
              <div className="empty-illustration-container">
                <FileText size={56} color="var(--text-muted)" />
                <div className="empty-cross-badge">×</div>
              </div>
              <h2 className="empty-title">No assignments yet</h2>
              <p className="empty-desc">
                Create your first assignment to start collecting and grading student submissions. 
                You can set up rubrics, define marking criteria, and let AI assist with grading.
              </p>
              <Link href="/create" style={{ textDecoration: 'none' }}>
                <button className="btn-primary">
                  <Plus size={18} />
                  Create Your First Assignment
                </button>
              </Link>
            </div>
          ) : (
            /* FILLED STATE */
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="dashboard-header">
                <div className="dashboard-title-area">
                  <h1 className="dashboard-main-title">Assignments</h1>
                  <span className="dashboard-sub-title">Manage and create assignments for your classes.</span>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="search-filter-bar">
                <button className="filter-btn">
                  <SlidersHorizontal size={16} />
                  Filter By
                </button>
                <div className="search-input-container">
                  <Search size={16} color="var(--text-muted)" />
                  <input 
                    type="text" 
                    placeholder="Search Assignment" 
                    className="search-input" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid of Cards */}
              <div className="assignments-grid">
                {filteredAssignments.map((item) => (
                  <Link 
                    key={item._id} 
                    href={`/assignment/${item._id}`} 
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="assignment-card">
                      <div className="card-top">
                        <span className="card-title" title={item.title}>{item.title}</span>
                        <div style={{ position: 'relative' }}>
                          <button 
                            className="menu-trigger"
                            onClick={(e) => toggleMenu(e, item._id)}
                          >
                            <MoreVertical size={18} />
                          </button>
                          
                          {activeMenuId === item._id && (
                            <div className="card-menu animate-fade-in" ref={menuRef}>
                              <Link href={`/assignment/${item._id}`} style={{ textDecoration: 'none' }}>
                                <button className="menu-item">
                                  <Eye size={14} />
                                  View Assignment
                                </button>
                              </Link>
                              <button 
                                className="menu-item delete"
                                onClick={(e) => handleDelete(e, item._id)}
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="card-metadata">
                        <span>Assigned on: {formatDate(item.createdAt)}</span>
                        {item.dueDate ? (
                          <span>Due: {formatDate(item.dueDate)}</span>
                        ) : (
                          <span>No due date</span>
                        )}
                        <span className={`status-badge ${item.status}`}>
                          {item.status === 'completed' && 'Completed'}
                          {item.status === 'generating' && 'Generating...'}
                          {item.status === 'pending' && 'Queued'}
                          {item.status === 'failed' && 'Failed'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Bottom Create Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '36px' }} className="header-title-desktop">
                <Link href="/create" style={{ textDecoration: 'none' }}>
                  <button 
                    className="btn-primary" 
                    style={{ 
                      borderRadius: '24px', 
                      backgroundColor: '#0F172A',
                      padding: '10px 24px',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                    }}
                  >
                    <Plus size={16} />
                    Create Assignment
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
        <MobileNav showFab={assignments.length > 0} />
      </main>
    </div>
  );
}
