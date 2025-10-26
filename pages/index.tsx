import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import NoteCard from '../components/NoteCard';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../lib/auth-context';
import { importFromFile, exportMultipleNotes } from '../lib/exportImport';
import Modal from '../components/Modal';

// Note interface matching the API response
interface Note {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Home Page Component
 * 
 * Main page displaying all notes in a responsive grid layout.
 * Features:
 * - Fetches notes from /api/notes on component mount
 * - Debounced search functionality (300ms delay)
 * - Server-side search for large datasets (>50 notes)
 * - Client-side filtering for small datasets
 * - Responsive grid layout using Tailwind CSS
 * - Add Note button linking to create new note page
 * - Real-time updates when notes are deleted or updated
 * 
 * Usage: Accessible at the root route "/"
 */
const HomePage: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useServerSearch, setUseServerSearch] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedNote, setImportedNote] = useState<Partial<Note> | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ref for debounce timer
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Threshold for switching to server-side search
  const SERVER_SEARCH_THRESHOLD = 50;

  // Fetch notes from API with optional search query
  const fetchNotes = async (query?: string) => {
    try {
      setIsLoading(!query); // Only show main loading for initial fetch
      if (query) setIsSearching(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Build URL with search query if provided
      const url = query ? `/api/notes?q=${encodeURIComponent(query)}` : '/api/notes';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        if (query) {
          // Server search - update filtered notes only
          setFilteredNotes(data.data);
        } else {
          // Initial load - update both
          setNotes(data.data);
          setFilteredNotes(data.data);
          // Determine if we should use server search based on count
          setUseServerSearch(data.data.length > SERVER_SEARCH_THRESHOLD);
        }
      } else {
        setError(data.message || 'Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Failed to fetch notes. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  // Client-side filter for small datasets
  const filterNotesClientSide = (query: string) => {
    if (!query.trim()) {
      setFilteredNotes(notes);
      return;
    }

    const filtered = notes.filter(note =>
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase()) ||
      (note.summary && note.summary.toLowerCase().includes(query.toLowerCase()))
    );

    setFilteredNotes(filtered);
  };

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      if (query.trim() && useServerSearch) {
        // Use server-side search for large datasets
        fetchNotes(query);
      } else if (query.trim()) {
        // Use client-side filter for small datasets
        filterNotesClientSide(query);
      } else {
        // Reset to show all notes
        setFilteredNotes(notes);
      }
    }, 300); // 300ms debounce delay
  }, [notes, useServerSearch]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Show immediate feedback for clearing search
    if (!query.trim()) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      setFilteredNotes(notes);
      setIsSearching(false);
    } else {
      setIsSearching(true);
      debouncedSearch(query);
    }
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Handle note deletion
  const handleNoteDelete = (noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
    setFilteredNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
  };

  // Handle note update (e.g., when summary is generated)
  const handleNoteUpdate = (noteId: string, updatedNote: Note) => {
    setNotes(prevNotes =>
      prevNotes.map(note => note._id === noteId ? updatedNote : note)
    );
    setFilteredNotes(prevNotes =>
      prevNotes.map(note => note._id === noteId ? updatedNote : note)
    );
  };

  // Handle file import
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsedNote = await importFromFile(file);
      setImportedNote(parsedNote);
      setIsImportModalOpen(true);
    } catch (error) {
      console.error('Error importing file:', error);
      alert(error instanceof Error ? error.message : 'Failed to import file');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save imported note
  const handleSaveImportedNote = async () => {
    if (!importedNote) return;

    setIsImporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importedNote),
      });

      const data = await response.json();

      if (data.success) {
        // Add new note to the list
        setNotes(prevNotes => [data.data, ...prevNotes]);
        setFilteredNotes(prevNotes => [data.data, ...prevNotes]);
        setIsImportModalOpen(false);
        setImportedNote(null);
      } else {
        alert('Failed to save imported note');
      }
    } catch (error) {
      console.error('Error saving imported note:', error);
      alert('Failed to save imported note');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle export all notes
  const handleExportAll = (format: 'txt' | 'md') => {
    if (notes.length === 0) {
      alert('No notes to export');
      return;
    }
    exportMultipleNotes(notes, format);
  };

  // Fetch notes on component mount
  useEffect(() => {
    if (!authLoading) {
      fetchNotes();
    }
  }, [authLoading]);

  // Show loading state while authentication is being verified
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                My Notes
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 transition-colors duration-300">
                Welcome back, {user?.name}! Organize your thoughts and ideas
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link
                href="/notes/new"
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Note
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar and Actions */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search Bar */}
          <div className="relative max-w-lg flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="block w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm hover:shadow-md transition-all duration-200"
            />
            {/* Clear button or searching indicator */}
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              {isSearching ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
              ) : searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilteredNotes(notes);
                    setIsSearching(false);
                  }}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 hover:scale-110"
                  title="Clear search"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>

          {/* Import/Export Actions */}
          <div className="flex gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".txt,.md,.markdown"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Note
            </button>
            <button
              onClick={() => handleExportAll('md')}
              disabled={notes.length === 0}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export All
            </button>
          </div>
        </div>

        {/* Search mode indicator */}
        {notes.length > SERVER_SEARCH_THRESHOLD && (
          <div className="mb-4 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <svg className="inline h-3 w-3 mr-2 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Using server-side search for better performance</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading notes...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6 animate-fade-in">
            <div className="flex">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => fetchNotes()}
                    className="bg-red-100 dark:bg-red-800/30 px-3 py-1 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors duration-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Grid */}
        {!isLoading && !error && (
          <>
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {searchQuery ? 'No notes found' : 'No notes yet'}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery 
                    ? 'Try adjusting your search terms.' 
                    : 'Get started by creating your first note.'
                  }
                </p>
                {!searchQuery && (
                  <div className="mt-6">
                    <Link
                      href="/notes/new"
                      className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Note
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onDelete={handleNoteDelete}
                    onUpdate={handleNoteUpdate}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Results Count */}
        {!isLoading && !error && filteredNotes.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 animate-fade-in">
            Showing {filteredNotes.length} of {notes.length} notes
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}
      </main>

      {/* Import Preview Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportedNote(null);
        }}
        title="Import Note Preview"
      >
        {importedNote && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title:
              </label>
              <input
                type="text"
                value={importedNote.title || ''}
                onChange={(e) => setImportedNote({ ...importedNote, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content:
              </label>
              <textarea
                value={importedNote.content || ''}
                onChange={(e) => setImportedNote({ ...importedNote, content: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportedNote(null);
                }}
                disabled={isImporting}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveImportedNote}
                disabled={isImporting || !importedNote.title || !importedNote.content}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Importing...
                  </>
                ) : (
                  'Save Note'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HomePage;

