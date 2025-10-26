import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Modal from './Modal';
import NoteHistoryModal from './NoteHistoryModal';
import { exportAsTxt, exportAsMarkdown, exportAsPdf } from '../lib/exportImport';

// Note interface matching the API response
interface Note {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

// Props interface for NoteCard component
interface NoteCardProps {
  note: Note;
  onDelete: (noteId: string) => void;
  onUpdate: (noteId: string, updatedNote: Note) => void;
}

/**
 * NoteCard Component
 * 
 * Displays a single note in a card format with actions.
 * Features:
 * - Shows note title, truncated content, creation date, and summary
 * - Edit button linking to edit page
 * - Summarize button that calls API and updates the card
 * - Delete button with confirmation modal
 * - Responsive design with Tailwind CSS
 * 
 * Usage:
 * <NoteCard 
 *   note={noteObject} 
 *   onDelete={(id) => handleDelete(id)}
 *   onUpdate={(id, updatedNote) => handleUpdate(id, updatedNote)}
 * />
 */
const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onUpdate }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [summary, setSummary] = useState(note.summary || '');
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportMenuOpen]);

  // Truncate content for display
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle summarize action
  const handleSummarize = async () => {
    if (isSummarizing) return;
    
    setIsSummarizing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ noteId: note._id }),
      });

      const data = await response.json();

      if (data.success) {
        setSummary(data.data.summary);
        // Update the note object with new summary
        onUpdate(note._id, { ...note, summary: data.data.summary });
      } else {
        console.error('Failed to generate summary:', data.message);
        alert('Failed to generate summary. Please try again.');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Error generating summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handle delete action
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notes/${note._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        onDelete(note._id);
        setIsDeleteModalOpen(false);
      } else {
        console.error('Failed to delete note:', data.message);
        alert('Failed to delete note. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting note. Please try again.');
    }
  };

  // Handle export actions
  const handleExport = async (format: 'txt' | 'md' | 'pdf') => {
    setIsExporting(true);
    setIsExportMenuOpen(false);
    
    try {
      if (format === 'txt') {
        exportAsTxt(note);
      } else if (format === 'md') {
        exportAsMarkdown(note);
      } else if (format === 'pdf') {
        await exportAsPdf(note);
      }
    } catch (error) {
      console.error('Error exporting note:', error);
      alert('Failed to export note. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 hover:scale-105 hover:-translate-y-1 animate-slide-up group">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 mr-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
            {note.title}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {formatDate(note.createdAt)}
          </span>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {truncateContent(note.content)}
          </p>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg border-l-4 border-primary-500 dark:border-primary-400">
            <h4 className="text-sm font-medium text-primary-900 dark:text-primary-200 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Summary
            </h4>
            <p className="text-sm text-primary-800 dark:text-primary-300">{summary}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/notes/${note._id}/edit`}
            className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
          
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>
          
          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm rounded-lg hover:shadow-md disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center"
          >
            {isSummarizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                Summarizing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Summarize
              </>
            )}
          </button>

          {/* Export Button with Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExporting}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm rounded-lg hover:shadow-md disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {/* Export Dropdown Menu */}
            {isExportMenuOpen && (
              <div className="absolute z-10 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1">
                <button
                  onClick={() => handleExport('txt')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Text (.txt)
                </button>
                <button
                  onClick={() => handleExport('md')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Markdown (.md)
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF (.pdf)
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this note? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Note History Modal */}
      <NoteHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        noteId={note._id}
        onRestore={(versionNumber) => {
          // Refresh the note data after restore
          console.log(`Note restored to version ${versionNumber}`);
        }}
      />
    </>
  );
};

export default NoteCard;
