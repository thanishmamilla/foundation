'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import MobileNav from '../../../components/MobileNav';
import { useAssignmentStore } from '../../../store/assignmentStore';
import { 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  ArrowLeft,
  FileText
} from 'lucide-react';

export default function AssignmentOutput() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const {
    activeAssignment,
    fetchAssignment,
    regenerateAssignment,
    connectWebSocket,
    disconnectWebSocket,
    wsProgress,
    wsStatus,
    isLoading
  } = useAssignmentStore();

  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [studentSection, setStudentSection] = useState('');

  useEffect(() => {
    // 1. Fetch current database record
    fetchAssignment(id).then((assignment) => {
      if (assignment) {
        // 2. If it's not fully completed/failed, listen live on WebSockets
        if (assignment.status === 'pending' || assignment.status === 'generating') {
          connectWebSocket(id, () => {
            // Callback: refresh record when completed
            fetchAssignment(id);
          });
        }
      }
    });

    return () => {
      disconnectWebSocket();
    };
  }, [id, fetchAssignment, connectWebSocket, disconnectWebSocket]);

  // Connect WebSocket if status changes to pending/generating externally
  useEffect(() => {
    if (activeAssignment?.status === 'pending' || activeAssignment?.status === 'generating') {
      connectWebSocket(id, () => {
        fetchAssignment(id);
      });
    }
  }, [activeAssignment?.status, id, connectWebSocket, fetchAssignment]);

  const handleRegenerate = async () => {
    if (confirm('Are you sure you want to regenerate this question paper? All current questions will be overwritten.')) {
      await regenerateAssignment(id);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`http://localhost:5000/api/assignments/${id}/pdf`, '_blank');
  };

  const currentStatus = activeAssignment?.status || wsStatus;
  const progressPercent = wsProgress || (currentStatus === 'completed' ? 100 : 0);

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-layout">
        <Header title="Assessment Sheet" showBack={true} />

        <div className="content-body">
          {isLoading && !activeAssignment ? (
            <div className="skeleton-loader animate-fade-in">
              <div className="spinner"></div>
              <p className="skeleton-title">Retrieving assignment details...</p>
            </div>
          ) : !activeAssignment ? (
            <div className="skeleton-loader animate-fade-in" style={{ borderColor: '#EF4444' }}>
              <AlertTriangle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
              <p className="skeleton-title" style={{ color: '#EF4444' }}>Assignment Not Found</p>
              <p className="skeleton-subtitle">The requested assessment paper could not be found in the database.</p>
              <button 
                className="btn-primary" 
                style={{ marginTop: '24px' }}
                onClick={() => router.push('/')}
              >
                Back to Dashboard
              </button>
            </div>
          ) : (currentStatus === 'pending' || currentStatus === 'generating') ? (
            /* GENERATING STATE */
            <div className="skeleton-loader animate-fade-in">
              <div className="spinner"></div>
              <h2 className="skeleton-title">Generating Assignment Paper...</h2>
              <div className="skeleton-progress-container">
                <div 
                  className="skeleton-progress-bar" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="skeleton-percent">{progressPercent}% Completed</span>
              <p className="skeleton-subtitle">
                Please wait while our AI engine compiles the questions, sections, and answer key. 
                This will update automatically.
              </p>
            </div>
          ) : currentStatus === 'failed' ? (
            /* FAILED STATE */
            <div className="skeleton-loader animate-fade-in" style={{ borderColor: '#EF4444' }}>
              <AlertTriangle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
              <h2 className="skeleton-title" style={{ color: '#EF4444' }}>AI Generation Failed</h2>
              <p className="skeleton-subtitle" style={{ maxWidth: '400px', margin: '0 auto 24px auto' }}>
                Reason: {activeAssignment.error || 'An unexpected error occurred during prompt construction.'}
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-primary" onClick={handleRegenerate}>
                  <RefreshCw size={14} />
                  Retry Generation
                </button>
                <button 
                  className="btn-wizard-prev" 
                  onClick={() => router.push('/')}
                >
                  Back to List
                </button>
              </div>
            </div>
          ) : (
            /* COMPLETED STATE (EXAM PAPER RENDER) */
            <div className="output-layout-container animate-fade-in">
              {/* Floating Action Banner */}
              <div className="floating-action-banner">
                <span className="banner-message">
                  Certainly! Here is the customized Question Paper for your{' '}
                  <strong>{activeAssignment.paper?.subject || 'Assessment'}</strong> class.
                </span>
                <div className="banner-actions">
                  <button className="btn-banner-pdf" onClick={handleDownloadPDF}>
                    <Download size={15} />
                    Download as PDF
                  </button>
                  <button className="btn-banner-regen" onClick={handleRegenerate}>
                    <RefreshCw size={14} />
                    Regenerate
                  </button>
                </div>
              </div>

              {/* White Exam Sheet Paper */}
              <div className="exam-paper-sheet">
                {/* School Name */}
                <h1 className="exam-school-name">{activeAssignment.paper?.schoolName}</h1>
                
                {/* Subject & Class */}
                <h2 className="exam-subject-class">
                  Subject: {activeAssignment.paper?.subject} | Class: {activeAssignment.paper?.className}
                </h2>

                {/* Metadata Allowed & Marks */}
                <div className="exam-metadata-row">
                  <span>Time Allowed: {activeAssignment.paper?.timeAllowed}</span>
                  <span>Maximum Marks: {activeAssignment.paper?.maxMarks}</span>
                </div>

                {/* Instructions */}
                <p className="exam-instructions">
                  Instructions: {activeAssignment.paper?.instructions}
                </p>

                {/* Student Inputs */}
                <div className="exam-student-inputs">
                  <div className="student-input-field">
                    <span>Name:</span>
                    <input 
                      type="text" 
                      className="student-input-line" 
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                  </div>
                  <div className="student-input-field roll">
                    <span>Roll Number:</span>
                    <input 
                      type="text" 
                      className="student-input-line" 
                      value={studentRoll}
                      onChange={(e) => setStudentRoll(e.target.value)}
                    />
                  </div>
                  <div className="student-input-field sec">
                    <span>Section:</span>
                    <input 
                      type="text" 
                      className="student-input-line" 
                      value={studentSection}
                      onChange={(e) => setStudentSection(e.target.value)}
                    />
                  </div>
                </div>

                {/* Sections & Questions */}
                {activeAssignment.paper?.sections.map((section, sIdx) => (
                  <div className="exam-section-container" key={sIdx}>
                    <h3 className="exam-section-title">{section.title}</h3>
                    <p className="exam-section-instruction">{section.instruction}</p>

                    <div className="exam-questions-list">
                      {section.questions.map((q, qIdx) => (
                        <div className="exam-question-item" key={qIdx}>
                          <div className="exam-question-left">
                            <span 
                              className={`difficulty-badge ${
                                q.difficulty.toLowerCase() === 'easy' ? 'easy' : 
                                q.difficulty.toLowerCase() === 'hard' ? 'hard' : 'moderate'
                              }`}
                            >
                              {q.difficulty}
                            </span>
                            <span className="exam-question-text">{q.text}</span>
                          </div>
                          <span className="exam-question-marks">[{q.marks} Mark{q.marks > 1 ? 's' : ''}]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* End Tag */}
                <div className="exam-end-tag">
                  --- End of Question Paper ---
                </div>

                {/* Answer Key inside Paper */}
                {activeAssignment.answerKey && activeAssignment.answerKey.length > 0 && (
                  <div className="exam-answer-key-section">
                    <h3 className="answer-key-title">Answer Key</h3>
                    <p className="answer-key-subtitle">(For Evaluator Reference Only)</p>
                    
                    <div className="answer-key-list">
                      {activeAssignment.answerKey.map((ans, aIdx) => (
                        <div className="answer-key-item" key={aIdx}>
                          {ans}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <MobileNav showFab={false} />
      </main>
    </div>
  );
}
