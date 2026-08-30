'use client';

import React, { useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import MobileNav from '../../../components/MobileNav';
import { ChevronDown, ChevronUp, ZoomIn, ZoomOut } from 'lucide-react';
import { useEvaluationStore } from '../../../store/evaluationStore';
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('../../../components/PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 text-gray-500 h-[800px] w-full bg-gray-300 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
      <p>Loading PDF Viewer...</p>
    </div>
  ),
});

export default function MappingPage() {
  const { questions, answerSheetImageUrl, answerSheetType } = useEvaluationStore();
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // If questions are empty, it means we are still loading/extracting from the API
  const isLoading = questions.length === 0;

  if (isLoading) {
    return (
      <div className="app-container">
        <Sidebar />
        <main className="main-layout flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center animate-pulse">
            <div className="relative mb-6">
              <div className="text-6xl text-orange-500">✨</div>
              <div className="absolute top-0 -right-4 text-3xl text-orange-300">✨</div>
              <div className="absolute bottom-0 -left-4 text-2xl text-orange-400">✨</div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Extracting...</h2>
            <p className="text-gray-500 mt-2">This may take a while as AI maps the answers.</p>
          </div>
        </main>
      </div>
    );
  }

  // Get active question for bounding box highlight
  const activeQuestion = questions.find(q => q.id === activeQuestionId);

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-layout flex flex-col overflow-hidden">
        <Header title="Exams" />
        
        <div className="flex-1 flex overflow-hidden p-4 gap-4 bg-gray-100">
          
          {/* Left Pane: Extracted Questions */}
          <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-sm">Extracted Questions (From question paper)</h3>
              <button 
                onClick={() => setActiveQuestionId(null)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                Clear Selection
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-100 bg-orange-50/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Grading Summary</span>
                <span className="text-sm font-bold text-orange-600">
                  {questions.reduce((acc, q) => acc + (q.awardedMarks || 0), 0)} / {questions.reduce((acc, q) => acc + (q.totalMarks || 0), 0)} Marks
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, (questions.reduce((acc, q) => acc + (q.awardedMarks || 0), 0) / (questions.reduce((acc, q) => acc + (q.totalMarks || 0), 0) || 1)) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {questions.map((q) => {
                const isActive = activeQuestionId === q.id;
                
                return (
                  <div 
                    key={q.id}
                    onClick={() => setActiveQuestionId(isActive ? null : q.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isActive 
                        ? 'border-orange-400 bg-orange-50 shadow-sm relative' 
                        : 'border-gray-200 bg-white hover:border-orange-200'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-lg"></div>
                    )}
                    
                    <div className="flex gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isActive ? 'bg-orange-500 text-white' : 'bg-gray-800 text-white'
                      }`}>
                        {q.number}
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{q.text}</p>
                    </div>
                    
                    <div className="mt-3 flex justify-end items-center">
                      <div className={`font-bold text-xs px-2 py-1 rounded flex items-center gap-1 ${
                        q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {q.awardedMarks}/{q.totalMarks} {isActive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>

                    {isActive && q.studentAnswer && (
                      <div className="mt-4 pt-3 border-t border-orange-200">
                        <h4 className="text-xs font-bold text-gray-700 mb-1">
                          Student Answer {q.pageNumber ? `(Page ${q.pageNumber})` : ''}:
                        </h4>
                        <p className="text-xs text-gray-600 italic mb-3">"{q.studentAnswer}"</p>
                        
                        <h4 className="text-xs font-bold text-gray-700 mb-1">AI Feedback:</h4>
                        <p className="text-xs text-gray-600">{q.feedback}</p>
                        <h4 className="text-xs font-bold text-gray-700 mt-2 mb-1">Debug BBox:</h4>
                        <p className="text-xs text-gray-600">{JSON.stringify(q.boundingBox)}</p>
                      </div>
                    )}
                    
                    {isActive && !q.studentAnswer && (
                      <div className="mt-4 pt-3 border-t border-orange-200">
                        <p className="text-xs text-red-500 font-semibold">Student did not answer this question.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Answer Sheet */}
          <div className="w-2/3 bg-gray-200 rounded-xl overflow-hidden flex flex-col relative border border-gray-300">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 left-4 flex justify-between z-10">
              <div className="bg-gray-900/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
                Answer Sheet
              </div>
              
              <div className="flex gap-2 shadow-md rounded-full">
                <div className="bg-gray-900/80 backdrop-blur text-white flex items-center rounded-full overflow-hidden">
                  <button className="px-3 py-1.5 hover:bg-white/20"><ZoomOut size={14} /></button>
                  <span className="text-xs font-semibold px-2">100%</span>
                  <button className="px-3 py-1.5 hover:bg-white/20"><ZoomIn size={14} /></button>
                </div>
              </div>
            </div>

            {/* Answer Sheet Viewer */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-gray-800/10">
              {answerSheetImageUrl ? (
                <div className={`relative shadow-xl ${!answerSheetType || answerSheetType.startsWith('image/') ? 'inline-block' : 'w-full h-full'}`}>
                  {/* The uploaded file */}
                  {!answerSheetType || answerSheetType.startsWith('image/') ? (
                    <img 
                      src={answerSheetImageUrl} 
                      alt="Student Answer Sheet" 
                      className="block"
                      style={{ maxHeight: '800px' }}
                    />
                  ) : answerSheetType === 'application/pdf' ? (
                    <PdfViewer url={answerSheetImageUrl} activeQuestion={activeQuestion} />
                  ) : answerSheetType === 'text/plain' ? (
                    <iframe 
                      src={answerSheetImageUrl}
                      title="Student Answer Sheet"
                      className="w-full h-full bg-white rounded-lg"
                      style={{ minHeight: '800px' }}
                    />
                  ) : (
                    <div className="bg-white p-8 rounded-lg text-center flex flex-col items-center justify-center w-full h-full min-h-[800px]">
                      <p className="text-gray-500 mb-2">Unsupported file type for preview.</p>
                      <a href={answerSheetImageUrl} download className="text-orange-500 hover:underline">Download file</a>
                    </div>
                  )}

                  {/* Bounding Box Highlight overlay for Active Question (ONLY FOR IMAGES) */}
                  {(!answerSheetType || answerSheetType.startsWith('image/')) && activeQuestion && activeQuestion.boundingBox && (
                    (() => {
                      const bbox = activeQuestion.boundingBox;
                      let ymin, xmin, ymax, xmax;
                      if (Array.isArray(bbox)) {
                        [ymin, xmin, ymax, xmax] = bbox;
                      } else {
                        ({ ymin, xmin, ymax, xmax } = bbox);
                      }
                      
                      // Fallback if missing
                      if (ymin === undefined || xmin === undefined) return null;

                      // Gemini sometimes returns 0-1 floats instead of 0-1000 integers
                      const scale = (xmax <= 1.5 && ymax <= 1.5) ? 1 : 1000;

                      return (
                        <div 
                          className="absolute border-2 border-green-500 bg-green-500/20 rounded shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all duration-300 pointer-events-none z-50" 
                          style={{ 
                            top: `${(ymin / scale) * 100}%`, 
                            left: `${(xmin / scale) * 100}%`, 
                            width: `${((xmax - xmin) / scale) * 100}%`, 
                            height: `${((ymax - ymin) / scale) * 100}%`,
                          }}
                        >
                          <div className="absolute -top-3 -left-3 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow">
                            Q{activeQuestion.number}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : (
                <div className="bg-white w-full max-w-2xl h-[800px] flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>
            
          </div>
          
        </div>
        
        <MobileNav showFab={false} />
      </main>
    </div>
  );
}
