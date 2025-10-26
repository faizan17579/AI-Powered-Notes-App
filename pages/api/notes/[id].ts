import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import Note, { INote } from '../../../models/Note';
import mongoose from 'mongoose';
import { requireAuth } from '../../../lib/auth';

/**
 * GET /api/notes/[id] - Returns a single note by ID
 * PUT /api/notes/[id] - Updates a note by ID
 * DELETE /api/notes/[id] - Deletes a note by ID
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // Validate ID parameter
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'Note ID is required'
    });
  }

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'Invalid note ID format'
    });
  }

  // Handle GET request - fetch single note
  if (req.method === 'GET') {
    try {
      // Require authentication
      const userId = requireAuth(req);

      // Connect to database
      await connectToDatabase();

      // Find note by ID and user ID
      const note = await Note.findOne({ _id: id, userId: userId }).lean();

      // Check if note exists
      if (!note) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Note not found'
        });
      }

      // Return success response with note
      return res.status(200).json({
        success: true,
        data: note
      });

    } catch (error) {
      console.error('Error fetching note:', error);
      
      // Return error response
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch note'
      });
    }
  }

  // Handle PUT request - update note
  if (req.method === 'PUT') {
    try {
      // Require authentication
      const userId = requireAuth(req);

      // Validate request body
      const { title, content, summary } = req.body;

      // Check if at least one field is provided for update
      if (!title && !content && summary === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'At least one field (title, content, or summary) must be provided for update'
        });
      }

      // Validate field lengths if provided
      if (title && title.length > 200) {
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

      // First, fetch the current note to save its version
      const currentNote = await Note.findOne({ _id: id, userId: userId });

      // Check if note exists
      if (!currentNote) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Note not found'
        });
      }

      // Save current state as a version before updating
      const currentVersionData = {
        title: currentNote.title,
        content: currentNote.content,
        summary: currentNote.summary,
        createdAt: new Date(),
        versionNumber: currentNote.currentVersion,
      };
      
      // Add version to history
      currentNote.versions.push(currentVersionData);
      currentNote.currentVersion += 1;

      // Update the note fields
      if (title !== undefined) currentNote.title = title.trim();
      if (content !== undefined) currentNote.content = content.trim();
      if (summary !== undefined) currentNote.summary = summary.trim() || undefined;
      currentNote.updatedAt = new Date();

      // Save the note (this will include the version history)
      const updatedNote = await currentNote.save();

      // Return success response with updated note
      return res.status(200).json({
        success: true,
        data: updatedNote,
        message: 'Note updated successfully'
      });

    } catch (error) {
      console.error('Error updating note:', error);
      
      // Return error response
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update note'
      });
    }
  }

  // Handle DELETE request - delete note
  if (req.method === 'DELETE') {
    try {
      // Require authentication
      const userId = requireAuth(req);

      // Connect to database
      await connectToDatabase();

      // Delete note by ID and user ID
      const deletedNote = await Note.findOneAndDelete({ _id: id, userId: userId }).lean();

      // Check if note exists
      if (!deletedNote) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Note not found'
        });
      }

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Note deleted successfully',
        data: { id: deletedNote._id }
      });

    } catch (error) {
      console.error('Error deleting note:', error);
      
      // Return error response
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete note'
      });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
    message: 'Only GET, PUT, and DELETE methods are allowed for this endpoint'
  });
}
