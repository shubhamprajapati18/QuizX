import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { QuizBuilder } from './QuizBuilder';
import { api } from '../../services/api';
import { Upload, FileText, ArrowRight } from 'lucide-react';

export const QuizImport = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [extractedQuestions, setExtractedQuestions] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF or DOCX question paper file first.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.import.uploadDocument(formData);
      if (res.success && res.questions) {
        setExtractedQuestions(res.questions);
      } else {
        setError(res.message || 'Failed to extract questions.');
      }
    } catch (err) {
      setError(err.message || 'Document extraction failed. Please check file format.');
    } finally {
      setIsUploading(false);
    }
  };

  if (extractedQuestions) {
    return (
      <div className="space-y-6">
        <Alert type="success" title="Document Parsed Successfully!">
          Extracted {extractedQuestions.length} questions from {file?.name || 'document'}. You can now review, edit, assign marks, and configure quiz settings below before publishing.
        </Alert>
        <QuizBuilder initialQuestions={extractedQuestions} />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-6 sm:p-8 shadow-xs border-zinc-200">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-xl bg-zinc-900 text-white flex items-center justify-center mx-auto mb-3 font-bold shadow-xs">
          <Upload className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-zinc-900">Upload Exam Question Paper</h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
          Upload PDF, DOC, or DOCX files. Our parser automatically identifies questions, multiple choice options (A, B, C, D), and correct answers.
        </p>
      </div>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      <div className="border-2 border-dashed border-zinc-300 hover:border-zinc-900 rounded-xl p-6 sm:p-8 text-center bg-zinc-50/50 transition-colors relative cursor-pointer">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {file ? (
          <div className="flex flex-col items-center">
            <FileText className="w-10 h-10 text-zinc-900 mb-2" />
            <p className="font-bold text-zinc-900 text-sm">{file.name}</p>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
            <Badge variant="live" className="mt-3">FILE READY TO PARSE</Badge>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-zinc-400 mb-2" />
            <p className="text-xs sm:text-sm font-bold text-zinc-800">Click or drag & drop question paper here</p>
            <p className="text-[11px] text-zinc-400 mt-1">Supports PDF, DOC, DOCX up to 10MB</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={() => (window.location.href = '/dashboard/create')}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleUpload}
          isLoading={isUploading}
          disabled={!file}
          icon={ArrowRight}
        >
          Parse Document Questions
        </Button>
      </div>
    </Card>
  );
};
