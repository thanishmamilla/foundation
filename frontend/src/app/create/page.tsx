'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import MobileNav from '../../components/MobileNav';
import { useAssignmentStore } from '../../store/assignmentStore';
import { 
  Plus, 
  Trash, 
  Upload, 
  ArrowLeft, 
  ArrowRight, 
  Mic, 
  Calendar,
  X
} from 'lucide-react';

interface QuestionTypeRow {
  id: string;
  type: string;
  count: number;
  marks: number;
}

const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Fill in the Blanks',
];

export default function CreateAssignment() {
  const router = useRouter();
  const { createAssignment, isLoading } = useAssignmentStore();

  // Form State
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Question Types Table State
  const [rows, setRows] = useState<QuestionTypeRow[]>([
    { id: '1', type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { id: '2', type: 'Short Questions', count: 3, marks: 2 },
    { id: '3', type: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
    { id: '4', type: 'Numerical Problems', count: 5, marks: 5 },
  ]);

  const [formError, setFormError] = useState<string | null>(null);

  // File Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.type.startsWith('image/') || file.type === 'text/plain') {
        setUploadedFile(file);
      } else {
        alert('Unsupported file type. Please upload a PDF, image, or text file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  // Row Manipulation Handlers
  const addRow = () => {
    const newId = String(Date.now());
    const unusedType = QUESTION_TYPES.find(
      (type) => !rows.some((row) => row.type === type)
    ) || QUESTION_TYPES[0];

    setRows([...rows, { id: newId, type: unusedType, count: 5, marks: 2 }]);
  };

  const deleteRow = (id: string) => {
    if (rows.length === 1) {
      alert('You must have at least one question type defined.');
      return;
    }
    setRows(rows.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, field: keyof QuestionTypeRow, value: any) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          let updatedValue = value;
          if (field === 'count' || field === 'marks') {
            updatedValue = Math.max(1, Number(value)); // Ensure minimum of 1
          }
          return { ...row, [field]: updatedValue };
        }
        return row;
      })
    );
  };

  const incrementCount = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (row) updateRow(id, 'count', row.count + 1);
  };

  const decrementCount = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (row && row.count > 1) updateRow(id, 'count', row.count - 1);
  };

  const incrementMarks = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (row) updateRow(id, 'marks', row.marks + 1);
  };

  const decrementMarks = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (row && row.marks > 1) updateRow(id, 'marks', row.marks - 1);
  };

  // Live Summary Metrics
  const totalQuestions = rows.reduce((sum, row) => sum + row.count, 0);
  const totalMarks = rows.reduce((sum, row) => sum + (row.count * row.marks), 0);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validations
    if (!title.trim()) {
      setFormError('Please enter an assignment title (e.g. Quiz on Electricity)');
      return;
    }

    if (rows.length === 0) {
      setFormError('Please add at least one question type config row.');
      return;
    }

    for (const row of rows) {
      if (row.count <= 0 || row.marks <= 0) {
        setFormError('Question counts and marks must be positive values.');
        return;
      }
    }

    // Submit
    const payload = {
      title: title.trim(),
      dueDate: dueDate ? dueDate : undefined,
      questionTypes: rows.map((r) => ({
        type: r.type,
        count: r.count,
        marks: r.marks,
      })),
      additionalInstructions: additionalInstructions.trim() || undefined,
    };

    console.log('Sending payload:', payload);
    const newAssignment = await createAssignment(payload);

    if (newAssignment) {
      // Redirect to assignment page to show generation status
      router.push(`/assignment/${newAssignment._id}`);
    } else {
      setFormError('Failed to create assignment. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-layout">
        <Header title="Create Assignment" showBack={true} />

        <div className="content-body">
          <div className="form-wizard-container animate-fade-in">
            {/* Wizard Steps indicator */}
            <div className="progress-bar-container">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '100%' }}></div>
              </div>
              <span className="progress-step-text">Step 2 of 2</span>
            </div>

            <h1 className="form-title">Assignment Details</h1>
            <p className="form-subtitle">Basic information about your assignment</p>

            {formError && (
              <div 
                style={{ 
                  backgroundColor: '#FEE2E2', 
                  color: '#EF4444', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  fontWeight: 600,
                  marginBottom: '20px'
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Assignment Title */}
              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Quiz on Electricity" 
                  className="form-input" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Upload Material (Figma style) */}
              <div className="form-group">
                <label className="form-label">Upload Material (Optional)</label>
                <div 
                  className="upload-zone"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    id="file-upload" 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                  />
                  <div className="upload-icon-container">
                    <Upload size={20} />
                  </div>
                  {uploadedFile ? (
                    <div>
                      <p className="upload-title" style={{ color: 'var(--primary)' }}>
                        ✓ {uploadedFile.name}
                      </p>
                      <p className="upload-subtitle">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button 
                        type="button" 
                        className="btn-browse" 
                        onClick={() => setUploadedFile(null)}
                        style={{ color: '#EF4444', borderColor: '#FEE2E2' }}
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="upload-title">Choose a file or drag & drop it here</p>
                      <p className="upload-subtitle">PDF, JPEG, PNG, TXT upto 10MB</p>
                      <button 
                        type="button" 
                        className="btn-browse"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Browse Files
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ width: '100%', paddingRight: '40px' }}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Question Config grid */}
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label">Question Type Configuration</label>
                <div className="question-config-container">
                  {rows.map((row) => (
                    <div className="question-config-row" key={row.id}>
                      {/* Type select */}
                      <select 
                        className="question-type-select"
                        value={row.type}
                        onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                      >
                        {QUESTION_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>

                      {/* Count & Marks Counters Container (Responsive) */}
                      <div className="question-counters-mobile-container">
                        {/* Count counter */}
                        <div className="question-counter-mobile-item">
                          <span className="question-counter-mobile-label">No. of Questions</span>
                          <div className="counter-pill-container">
                            <button 
                              type="button" 
                              className="btn-counter-action" 
                              onClick={() => decrementCount(row.id)}
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              className="input-counter-value" 
                              value={row.count}
                              onChange={(e) => updateRow(row.id, 'count', e.target.value)}
                            />
                            <button 
                              type="button" 
                              className="btn-counter-action" 
                              onClick={() => incrementCount(row.id)}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Marks counter */}
                        <div className="question-counter-mobile-item">
                          <span className="question-counter-mobile-label">Marks</span>
                          <div className="counter-pill-container">
                            <button 
                              type="button" 
                              className="btn-counter-action" 
                              onClick={() => decrementMarks(row.id)}
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              className="input-counter-value" 
                              value={row.marks}
                              onChange={(e) => updateRow(row.id, 'marks', e.target.value)}
                            />
                            <button 
                              type="button" 
                              className="btn-counter-action" 
                              onClick={() => incrementMarks(row.id)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Delete cross */}
                      <button 
                        type="button" 
                        className="btn-delete-row"
                        onClick={() => deleteRow(row.id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" className="btn-add-row" onClick={addRow}>
                  <Plus size={14} />
                  Add Question Type
                </button>
              </div>

              {/* Total metrics */}
              <div className="total-summary">
                <span>Total Questions: {totalQuestions}</span>
                <span>Total Marks: {totalMarks}</span>
              </div>

              {/* Additional Information */}
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label className="form-label">Additional Information (For better output)</label>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    placeholder="e.g. Generate a question paper for 3 hour exam duration based on NCERT electricity chapters..." 
                    className="form-input" 
                    style={{ width: '100%', height: '100px', resize: 'none', paddingRight: '40px' }}
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                  />
                  <button 
                    type="button" 
                    style={{ 
                      position: 'absolute', 
                      bottom: '12px', 
                      right: '12px', 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--text-secondary)',
                      cursor: 'pointer' 
                    }}
                  >
                    <Mic size={16} />
                  </button>
                </div>
              </div>

              {/* Form actions */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-wizard-prev"
                  onClick={() => router.push('/')}
                >
                  Previous
                </button>
                
                <button 
                  type="submit" 
                  className="btn-wizard-next"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Next'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
        <MobileNav showFab={false} />
      </main>
    </div>
  );
}
