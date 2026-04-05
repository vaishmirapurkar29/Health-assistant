'use client';

import { useState, useRef } from 'react';

interface Props {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
}

export default function UploadForm({ onSubmit, loading }: Props) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pdfFile) return;
    const fd = new FormData();
    fd.append('pdf', pdfFile);
    onSubmit(fd);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Upload a lab report</h1>
        <p className="text-sm text-gray-500">
          Upload your PDF lab report for a plain-language interpretation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* PDF drop zone */}
        <div
          onClick={() => pdfRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
            pdfFile ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={pdfRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
          />
          {pdfFile ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-indigo-700">{pdfFile.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                className="text-indigo-400 hover:text-indigo-600 ml-1"
              >
                ×
              </button>
            </div>
          ) : (
            <div>
              <svg className="mx-auto h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-500">Click to upload your lab report</p>
              <p className="text-xs text-gray-400 mt-1">PDF only</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!pdfFile || loading}
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Interpreting your results…
            </>
          ) : (
            'Interpret my results'
          )}
        </button>
      </form>
    </div>
  );
}
