'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import MobileNav from '../../components/MobileNav';
import { Upload, X, ArrowRight } from 'lucide-react';
import { useEvaluationStore } from '../../store/evaluationStore';

export default function ExamsPage() {
  const router = useRouter();
  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { setEvaluationData } = useEvaluationStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleRemoveFile = (setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    setter(null);
  };

  const handleStartMapping = async () => {
    if (!questionPaper || !answerSheet) return;
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('questionPaper', questionPaper);
      formData.append('answerSheet', answerSheet);
      
      const res = await fetch('http://localhost:5000/api/evaluate', {
        method: 'POST',
        body: formData,
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to evaluate files');
      }
      
      const answerSheetUrl = URL.createObjectURL(answerSheet);
      setEvaluationData(json.data.questions, answerSheetUrl, answerSheet.type);
      
      // Navigate to mapping page only after successful extraction
      router.push('/exams/mapping');
    } catch (err) {
      console.error(err);
      alert('Error during evaluation: ' + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-layout">
        <Header title="Exams" />

        <div className="content-body flex flex-col items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-4xl p-10 flex flex-col items-center relative overflow-hidden">
            
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              Upload <span className="text-orange-500 bg-orange-50 px-3 py-1 rounded-lg">Question Paper & Answer Sheets</span>
            </h1>
            <p className="text-gray-500 mb-10">Upload both files to get started</p>
            
            {/* Avatar illustration placeholder */}
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-10 relative">
              <div className="text-4xl">👩‍🏫</div>
              {/* decorative circles */}
              <div className="absolute top-0 -left-2 w-3 h-3 bg-orange-400 rounded-full"></div>
              <div className="absolute bottom-2 -right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
              <div className="absolute top-4 -right-4 w-4 h-4 bg-orange-200 rounded-full"></div>
            </div>

            {/* Upload Boxes Container */}
            <div className="flex w-full gap-6 mb-10">
              
              {/* Question Paper Dropzone */}
              <div className="flex-1 relative">
                {questionPaper ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex items-center justify-center gap-4 bg-gray-50 relative">
                    <div className="bg-red-100 text-red-500 p-2 rounded-md font-bold text-xs">PDF</div>
                    <div>
                      <p className="font-semibold text-sm truncate max-w-[200px]">{questionPaper.name}</p>
                      <p className="text-xs text-gray-500">{(questionPaper.size / 1024 / 1024).toFixed(1)}MB</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveFile(setQuestionPaper)}
                      className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 shadow-md hover:bg-gray-700 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all h-full">
                    <div className="bg-gray-100 p-3 rounded-lg mb-3">
                      <Upload size={20} className="text-gray-600" />
                    </div>
                    <p className="font-semibold text-sm">Upload <span className="text-orange-500">Question Paper</span></p>
                    <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
                    <input type="file" className="hidden" accept="image/*,application/pdf,text/plain,.txt" onChange={(e) => handleFileChange(e, setQuestionPaper)} />
                  </label>
                )}
              </div>

              {/* Answer Sheet Dropzone */}
              <div className="flex-1 relative">
                {answerSheet ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex items-center justify-center gap-4 bg-gray-50 relative">
                    <div className="bg-red-100 text-red-500 p-2 rounded-md font-bold text-xs">PDF</div>
                    <div>
                      <p className="font-semibold text-sm truncate max-w-[200px]">{answerSheet.name}</p>
                      <p className="text-xs text-gray-500">{(answerSheet.size / 1024 / 1024).toFixed(1)}MB</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveFile(setAnswerSheet)}
                      className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 shadow-md hover:bg-gray-700 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all h-full">
                    <div className="bg-gray-100 p-3 rounded-lg mb-3">
                      <Upload size={20} className="text-green-600" />
                    </div>
                    <p className="font-semibold text-sm">Upload <span className="text-orange-500">Answer Sheet</span></p>
                    <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
                    <input type="file" className="hidden" accept="image/*,application/pdf,text/plain,.txt" onChange={(e) => handleFileChange(e, setAnswerSheet)} />
                  </label>
                )}
              </div>

            </div>

            {/* Start Mapping Button */}
            <button 
              onClick={handleStartMapping}
              disabled={!questionPaper || !answerSheet || isUploading}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                questionPaper && answerSheet 
                  ? 'bg-gray-900 text-white hover:bg-black shadow-lg cursor-pointer hover:scale-105' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Start Mapping'}
              {!isUploading && <ArrowRight size={18} />}
            </button>
            <p className="text-xs text-gray-400 mt-4">Once both files are uploaded, you'll be able to map answers with questions</p>

          </div>
        </div>
        
        <MobileNav showFab={false} />
      </main>
    </div>
  );
}
