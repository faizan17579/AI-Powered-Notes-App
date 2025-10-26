// API helper functions for note operations
// Provides a clean interface for all note-related API calls with proper error handling

// Type definitions
export interface Note {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
  summary?: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  summary?: string;
}

export interface SummarizeRequest {
  noteId?: string;
  content?: string;
}

export interface SummarizeResponse {
  summary: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

// Generic fetch wrapper with error handling and authentication
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth token
  const token = getAuthToken();
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }), // Add auth header if token exists
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        errorData.error || 
        `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API request failed: ${error.message}`);
    }
    throw new Error('API request failed: Unknown error');
  }
}

/**
 * Fetch all notes sorted by creation date (newest first)
 * @param searchQuery - Optional search query to filter notes
 * @returns Promise<Note[]> - Array of notes
 */
export async function getNotes(searchQuery?: string): Promise<Note[]> {
  try {
    const endpoint = searchQuery 
      ? `/api/notes?q=${encodeURIComponent(searchQuery)}`
      : '/api/notes';
    
    const response = await apiRequest<ApiResponse<Note[]>>(endpoint);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch notes');
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw new Error('Failed to fetch notes. Please try again.');
  }
}

/**
 * Fetch a single note by ID
 * @param id - Note ID
 * @returns Promise<Note> - The note object
 */
export async function getNote(id: string): Promise<Note> {
  if (!id) {
    throw new Error('Note ID is required');
  }

  try {
    const response = await apiRequest<ApiResponse<Note>>(`/api/notes/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch note');
    }
    
    if (!response.data) {
      throw new Error('Note not found');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching note:', error);
    throw new Error('Failed to fetch note. Please try again.');
  }
}

/**
 * Create a new note
 * @param data - Note data (title, content, optional summary)
 * @returns Promise<Note> - The created note
 */
export async function createNote(data: CreateNoteData): Promise<Note> {
  if (!data.title?.trim()) {
    throw new Error('Title is required');
  }
  
  if (!data.content?.trim()) {
    throw new Error('Content is required');
  }

  if (data.title.length > 200) {
    throw new Error('Title cannot exceed 200 characters');
  }

  if (data.summary && data.summary.length > 500) {
    throw new Error('Summary cannot exceed 500 characters');
  }

  try {
    const response = await apiRequest<ApiResponse<Note>>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create note');
    }
    
    if (!response.data) {
      throw new Error('Failed to create note');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw new Error('Failed to create note. Please try again.');
  }
}

/**
 * Update an existing note
 * @param id - Note ID
 * @param data - Updated note data
 * @returns Promise<Note> - The updated note
 */
export async function updateNote(id: string, data: UpdateNoteData): Promise<Note> {
  if (!id) {
    throw new Error('Note ID is required');
  }

  if (data.title && data.title.length > 200) {
    throw new Error('Title cannot exceed 200 characters');
  }

  if (data.summary && data.summary.length > 500) {
    throw new Error('Summary cannot exceed 500 characters');
  }

  // Check if at least one field is provided for update
  if (!data.title && !data.content && data.summary === undefined) {
    throw new Error('At least one field must be provided for update');
  }

  try {
    const response = await apiRequest<ApiResponse<Note>>(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update note');
    }
    
    if (!response.data) {
      throw new Error('Note not found');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error updating note:', error);
    throw new Error('Failed to update note. Please try again.');
  }
}

/**
 * Delete a note
 * @param id - Note ID
 * @returns Promise<void>
 */
export async function deleteNote(id: string): Promise<void> {
  if (!id) {
    throw new Error('Note ID is required');
  }

  try {
    const response = await apiRequest<ApiResponse<{ id: string }>>(`/api/notes/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete note');
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    throw new Error('Failed to delete note. Please try again.');
  }
}

/**
 * Generate a summary for a note or content
 * @param request - Either noteId or content to summarize
 * @returns Promise<SummarizeResponse> - The generated summary
 */
export async function summarizeNote(request: SummarizeRequest): Promise<SummarizeResponse> {
  if (!request.noteId && !request.content) {
    throw new Error('Either noteId or content must be provided');
  }

  if (request.content && !request.content.trim()) {
    throw new Error('Content cannot be empty');
  }

  try {
    const response = await apiRequest<ApiResponse<SummarizeResponse>>('/api/summarize', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to generate summary');
    }
    
    if (!response.data) {
      throw new Error('Failed to generate summary');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary. Please try again.');
  }
}
