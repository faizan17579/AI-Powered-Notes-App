import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import Note, { INote } from '../../../models/Note';
import { requireAuth } from '../../../lib/auth';

// Type definitions for request body
interface CreateNoteRequest {
  title: string;
  content: string;
  summary?: string;
}

/**
 * GET /api/notes - Returns all notes sorted by createdAt in descending order (newest first)
 *                  Supports optional search query parameter ?q=term for text search
 * POST /api/notes - Creates a new note
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET request - fetch all notes or search
  if (req.method === 'GET') {
    try {
      // Require authentication
      const userId = requireAuth(req);

      // Connect to database
      await connectToDatabase();

      // Get search query from URL params
      const searchQuery = req.query.q as string | undefined;

      let notes;

      if (searchQuery && searchQuery.trim()) {
        // Perform text search using MongoDB text index
        // First, try text search if index exists
        try {
          notes = await Note.find(
            { 
              userId: userId,
              $text: { $search: searchQuery } 
            },
            { score: { $meta: 'textScore' } }
          )
            .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
            .lean();
        } catch (textSearchError) {
          // If text index doesn't exist, fall back to regex search
          console.log('Text index not found, using regex search fallback');
          const searchRegex = new RegExp(searchQuery, 'i');
          notes = await Note.find({
            userId: userId,
            $or: [
              { title: { $regex: searchRegex } },
              { content: { $regex: searchRegex } },
              { summary: { $regex: searchRegex } }
            ]
          })
            .sort({ createdAt: -1 })
            .lean();
        }
      } else {
        // Fetch all notes for the user sorted by createdAt descending
        notes = await Note.find({ userId: userId })
          .sort({ createdAt: -1 })
          .lean();
      }

      // Return success response with notes
      return res.status(200).json({
        success: true,
        data: notes,
        count: notes.length,
        searchQuery: searchQuery || null
      });

    } catch (error) {
      console.error('Error fetching notes:', error);
      
      // Return error response
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch notes'
      });
    }
  }

  // Handle POST request - create new note
  if (req.method === 'POST') {
    try {
      // Require authentication
      const userId = requireAuth(req);

      // Validate request body
      const { title, content, summary }: CreateNoteRequest = req.body;

      // Check required fields
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Title and content are required fields'
        });
      }

      // Validate field lengths
      if (title.length > 200) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Title cannot exceed 200 characters'
        });
      }

      if (summary && summary.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Summary cannot exceed 500 characters'
        });
      }

      // Connect to database
      await connectToDatabase();

      // Create new note
      const newNote = new Note({
        title: title.trim(),
        content: content.trim(),
        summary: summary?.trim() || undefined,
        userId: userId,
        versions: [],
        currentVersion: 1
      });

      // Save note to database
      const savedNote = await newNote.save();

      // Return success response with created note
      return res.status(201).json({
        success: true,
        data: savedNote,
        message: 'Note created successfully'
      });

    } catch (error) {
      console.error('Error creating note:', error);
      
      // Return error response
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create note'
      });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
    message: 'Only GET and POST methods are allowed for this endpoint'
  });
}
