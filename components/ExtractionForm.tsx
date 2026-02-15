import React from 'react';
import { MousePointerClick, Loader2, AlertCircle } from 'lucide-react';

interface ExtractionFormProps {
  onExtract: () => void;
  isLoading: boolean;
  error?: string;
}

export const ExtractionForm: React.FC<ExtractionFormProps> = ({ onExtract, isLoading, error }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 text-center">
      <div className="bg-linkedin-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <MousePointerClick className="w-8 h-8 text-linkedin-600" />
      </div>
      
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        LinkedIn Profile Detected?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Navigate to a LinkedIn profile tab and click below to automatically grab the details.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
        </div>
      )}

      <button
        onClick={onExtract}
        disabled={isLoading}
        className="w-full flex justify-center items-center gap-2 bg-linkedin-600 hover:bg-linkedin-700 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Scanning Page...
          </>
        ) : (
          <>
            <MousePointerClick className="w-5 h-5" />
            Clip Profile Data
          </>
        )}
      </button>
      
      <p className="mt-3 text-xs text-gray-400">
        No AI used. Direct page extraction.
      </p>
    </div>
  );
};
