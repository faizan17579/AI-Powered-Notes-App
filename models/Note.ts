import mongoose, { Document, Schema } from 'mongoose';

// Define the NoteVersion interface for versioning
export interface INoteVersion {
  title: string;
  content: string;
  summary?: string;
  createdAt: Date;
  versionNumber: number;
}

// Define the Note interface extending mongoose Document
export interface INote extends Document {
  title: string;
  content: string;
  summary?: string;
  userId: mongoose.Types.ObjectId;
  versions: INoteVersion[];
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define the NoteVersion schema
const NoteVersionSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  summary: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  versionNumber: {
    type: Number,
    required: true,
  },
});

// Define the Note schema
const NoteSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
  },
  summary: {
    type: String,
    trim: true,
    maxlength: [500, 'Summary cannot exceed 500 characters'],
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  versions: [NoteVersionSchema],
  currentVersion: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create text index on title, content, and summary for full-text search
NoteSchema.index({ 
  title: 'text', 
  content: 'text', 
  summary: 'text' 
}, {
  weights: {
    title: 10,      // Title matches are more important
    summary: 5,     // Summary matches are moderately important
    content: 1      // Content matches have standard weight
  },
  name: 'note_text_search'
});

// Update the updatedAt field before saving
NoteSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Update the updatedAt field before updating
NoteSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Global mongoose cache to avoid model recompilation in development
const global = globalThis as unknown as {
  mongooseModels: {
    Note: mongoose.Model<INote> | null;
  };
};

// Initialize global mongoose models cache if it doesn't exist
if (!global.mongooseModels) {
  global.mongooseModels = { Note: null };
}

// Export the Note model, reusing existing model if already compiled
const Note: mongoose.Model<INote> = global.mongooseModels.Note || mongoose.model<INote>('Note', NoteSchema);

// Cache the model globally to prevent recompilation in development
if (!global.mongooseModels.Note) {
  global.mongooseModels.Note = Note;
}

export default Note;
