import React, { useState, useEffect } from 'react';
import Modal from './Modal';

// Note version interface
interface NoteVersion {
  title: string;
  content: string;
  summary?: string;
  createdAt: string;
  versionNumber: number;
}

// Props interface for NoteHistoryModal component
interface NoteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  onRestore?: (versionNumber: number) => void;
}

/**
 * NoteHistoryModal Component
 * 
 * Displays note version history with restore functionality.
 * Features:
 * - Fetches note history from API
 * - Shows all versions with timestamps
 * - Allows restoring to previous versions
 * - Confirmation dialog for restore action
 * - Dark mode support
 * - Responsive design
 * 
 * Usage:
 * <NoteHistoryModal 
 *   isOpen={isModalOpen} 
 *   onClose={() => setIsModalOpen(false)}
 *   noteId={noteId}
 *   onRestore={(version) => handleRestore(version)}
 * />
 */
const NoteHistoryModal: React.FC<NoteHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  noteId, 
  onRestore 
}) => {
  const [history, setHistory] = useState<{
    noteId: string;
    currentVersion: number;
    versions: NoteVersion[];
    currentNote: NoteVersion;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreVersion, setRestoreVersion] = useState<number | null>(null);
  const [viewVersion, setViewVersion] = useState<NoteVersion | null>(null);

  // Fetch note history when modal opens
  useEffect(() => {
    if (isOpen && noteId) {
      fetchNoteHistory();
    }
  }, [isOpen, noteId]);

  // Fetch note history from API
  const fetchNoteHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notes/${noteId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setHistory(data.data);
      } else {
        setError(data.message || 'Failed to fetch note history');
      }
    } catch (error) {
      console.error('Error fetching note history:', error);
      setError('Failed to fetch note history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle restore action
  const handleRestore = async (versionNumber: number) => {
    setIsRestoring(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notes/${noteId}/history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ versionNumber }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh history
        await fetchNoteHistory();
        
        // Call parent callback if provided
        if (onRestore) {
          onRestore(versionNumber);
        }
        
        setRestoreVersion(null);
      } else {
        setError(data.message || 'Failed to restore version');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      setError('Failed to restore version. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Truncate content for display
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Note History"
      className="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading history...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* History Content */}
        {!isLoading && !error && history && (
          <>
            {/* Current Version */}
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-4 border-l-4 border-primary-500 dark:border-primary-400">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-200">
                  Current Version (v{history.currentVersion})
                </h3>
                <span className="text-sm text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-800 px-2 py-1 rounded-full">
                  Latest
                </span>
              </div>
              <p className="text-sm text-primary-800 dark:text-primary-300">
                {formatDate(history.currentNote.createdAt)}
              </p>
            </div>

            {/* Version History */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Previous Versions
              </h4>
              
              {history.versions.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No previous versions</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    This note hasn't been edited yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.versions
                    .sort((a, b) => b.versionNumber - a.versionNumber)
                    .map((version) => (
                    <div
                      key={version.versionNumber}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      onClick={() => setViewVersion(version)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              Version {version.versionNumber}
                            </h5>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                              {formatDate(version.createdAt)}
                            </span>
                            <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Click to view full details
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Title:</span>
                              <p className="text-sm text-gray-900 dark:text-white">{version.title}</p>
                            </div>
                            
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Content:</span>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {truncateContent(version.content)}
                              </p>
                            </div>
                            
                            {version.summary && (
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Summary:</span>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {truncateContent(version.summary, 80)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setRestoreVersion(version.versionNumber)}
                            disabled={isRestoring}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg hover:shadow-md disabled:bg-emerald-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center whitespace-nowrap"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restore
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Restore Confirmation Modal */}
        {restoreVersion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Restore
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to restore this note to version {restoreVersion}? 
                The current version will be saved as a new version before restoring.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setRestoreVersion(null)}
                  disabled={isRestoring}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRestore(restoreVersion)}
                  disabled={isRestoring}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg hover:shadow-md disabled:bg-emerald-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center"
                >
                  {isRestoring ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Restoring...
                    </>
                  ) : (
                    'Restore'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Version Details Modal */}
        {viewVersion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Version {viewVersion.versionNumber} - Full Details
                </h3>
                <button
                  onClick={() => setViewVersion(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Timestamp */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Saved on {formatDate(viewVersion.createdAt)}
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Title:
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-900 dark:text-white">{viewVersion.title}</p>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Content:
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 max-h-64 overflow-y-auto">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{viewVersion.content}</p>
                  </div>
                </div>

                {/* Summary */}
                {viewVersion.summary && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Summary:
                    </label>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500 dark:border-blue-400">
                      <p className="text-gray-900 dark:text-white">{viewVersion.summary}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewVersion(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewVersion(null);
                    setRestoreVersion(viewVersion.versionNumber);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restore This Version
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NoteHistoryModal;
