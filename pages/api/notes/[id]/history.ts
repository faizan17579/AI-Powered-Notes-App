import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import Note, { INote } from '../../../../models/Note';
import mongoose from 'mongoose';
import { requireAuth } from '../../../../lib/auth';

/**
 * GET /api/notes/[id]/history - Returns note version history
 * POST /api/notes/[id]/restore - Restores a note to a previous version
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

  // Handle GET request - fetch note history
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

      // Return success response with note history
      return res.status(200).json({
        success: true,
        data: {
          noteId: note._id,
          currentVersion: note.currentVersion,
          versions: note.versions || [],
          currentNote: {
            title: note.title,
            content: note.content,
            summary: note.summary,
            versionNumber: note.currentVersion,
            createdAt: note.updatedAt
          }
        }
      });

    } catch (error) {
      console.error('Error fetching note history:', error);
      
      // Return error response
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch note history'
      });
    }
  }

  // Handle POST request - restore note to previous version
  if (req.method === 'POST') {
    try {
      // Require authentication
      const userId = requireAuth(req);

      // Validate request body
      const { versionNumber } = req.body;

      // Check if version number is provided
      if (versionNumber === undefined || versionNumber === null) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Version number is required'
        });
      }

      // Validate version number
      if (typeof versionNumber !== 'number' || versionNumber < 1) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Version number must be a positive integer'
        });
      }

      // Connect to database
      await connectToDatabase();

      // Find note by ID and user ID
      const note = await Note.findOne({ _id: id, userId: userId });

      // Check if note exists
      if (!note) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Note not found'
        });
      }

      // Find the version to restore
      const versionToRestore = note.versions.find(v => v.versionNumber === versionNumber);

      if (!versionToRestore) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Version not found'
        });
      }

      // Save current state as a new version before restoring
      const currentVersion = {
        title: note.title,
        content: note.content,
        summary: note.summary,
        createdAt: new Date(),
        versionNumber: note.currentVersion,
      };
      
      note.versions.push(currentVersion);
      note.currentVersion += 1;

      // Restore the selected version
      note.title = versionToRestore.title;
      note.content = versionToRestore.content;
      note.summary = versionToRestore.summary;

      // Save the note
      const restoredNote = await note.save();

      // Return success response
      return res.status(200).json({
        success: true,
        data: restoredNote,
        message: `Note restored to version ${versionNumber}`
      });

    } catch (error) {
      console.error('Error restoring note:', error);
      
      // Return error response
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to restore note'
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
