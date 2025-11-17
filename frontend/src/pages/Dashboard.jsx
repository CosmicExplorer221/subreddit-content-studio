import { useState } from 'react';
import { useStore } from '../store/useStore';
import PostBrowser from '../components/PostBrowser';
import PostGenerator from '../components/PostGenerator';
import NotionUploader from '../components/NotionUploader';
import { Search, Download, FileText, Send } from 'lucide-react';

export default function Dashboard() {
  const { viewMode, setViewMode, selectedPosts } = useStore();

  return (
    <div className="max-w-7xl mx-auto">
      {/* View Mode Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setViewMode('browse')}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                ${viewMode === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Search size={18} />
              Fetch & Browse
            </button>

            <button
              onClick={() => setViewMode('generate')}
              disabled={selectedPosts.length === 0}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                ${viewMode === 'generate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                ${selectedPosts.length === 0 && 'opacity-50 cursor-not-allowed'}
              `}
            >
              <FileText size={18} />
              Review & Generate
              {selectedPosts.length > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                  {selectedPosts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode('notion')}
              disabled={selectedPosts.length === 0}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                ${viewMode === 'notion'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                ${selectedPosts.length === 0 && 'opacity-50 cursor-not-allowed'}
              `}
            >
              <Send size={18} />
              Send to Notion
            </button>
          </nav>
        </div>
      </div>

      {/* View Content */}
      <div className="mt-6">
        {viewMode === 'browse' && <PostBrowser />}
        {viewMode === 'generate' && <PostGenerator />}
        {viewMode === 'notion' && <NotionUploader />}
      </div>
    </div>
  );
}
