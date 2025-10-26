# 📝 AI Note-Taking App

A modern, full-stack note-taking application built with **Next.js**, **MongoDB**, and **Google Gemini AI**. Create, edit, and organize your notes with AI-powered summarization to quickly understand your content at a glance.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green?style=flat-square&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)

## ✨ Features

- **📋 Complete CRUD Operations** - Create, read, update, and delete notes
- **🤖 AI-Powered Summaries** - Generate concise summaries using Google Gemini AI
- **🔍 Intelligent Search & Filter** - Smart search that adapts to dataset size
  - Client-side filtering for < 50 notes (instant results)
  - Server-side MongoDB text search for 50+ notes (scalable)
  - Debounced input (300ms) for optimal performance
  - Real-time results with visual feedback
- **� User Authentication** - Secure JWT-based authentication system
  - User registration and login
  - Protected API routes with Bearer token authentication
  - Persistent sessions with localStorage
  - Secure password handling
- **📜 Version History** - Track all changes to your notes
  - Automatic version snapshots on every edit
  - View complete history with timestamps
  - Click any version to see full details (title, content, summary)
  - Restore previous versions with one click
  - Version comparison capabilities
- **� Export/Import Notes** - Portable note management
  - Export individual notes as TXT, Markdown (.md), or PDF
  - Export all notes as a single TXT or Markdown collection
  - Import notes from TXT or Markdown files
  - Preview and edit imported notes before saving
  - Client-side PDF generation with formatted styling
- **�📱 Responsive Design** - Beautiful UI built with Tailwind CSS
- **🌙 Dark Mode** - Full dark mode support across the entire app
- **💾 MongoDB Integration** - Persistent storage with Mongoose ODM and text indexing
- **⚡ Fast Performance** - Optimized with connection caching and lean queries
- **🔄 Smart Fallback** - Automatic fallback summarizer if AI service is unavailable

## 🛠️ Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose
- **AI Service**: Google Gemini AI (gemini-2.5-flash)
- **Export/Import**: html2pdf.js for PDF generation
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB Atlas account** (or local MongoDB instance)
- **Google Gemini API key**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai-note-app/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
# frontend/.env.local
MONGODB_URI=your_mongodb_connection_string_here
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 📝 Getting MongoDB URI

1. **Create a MongoDB Atlas Account** (free tier available):
   - Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up or log in to your account

2. **Create a Cluster**:
   - Follow the [MongoDB Atlas Quick Start Guide](https://www.mongodb.com/docs/atlas/getting-started/)
   - Choose the free M0 tier for development

3. **Get Your Connection String**:
   - Click **"Connect"** on your cluster
   - Choose **"Connect your application"**
   - Copy the connection string (looks like `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/`)
   - Replace `<password>` with your database user password
   - Add a database name after `.net/` (e.g., `.net/notes-app`)

**Example:**
```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/notes-app?retryWrites=true&w=majority
```

#### 🔑 Getting Google Gemini API Key

1. **Visit Google AI Studio**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account

2. **Create API Key**:
   - Click **"Get API Key"** or **"Create API Key"**
   - Select or create a Google Cloud project
   - Copy the generated API key

3. **Add to Environment Variables**:
   ```
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

**Note:** The app uses Google Gemini AI, not OpenAI. If you prefer OpenAI, you would need to modify the `/api/summarize` endpoint to use the OpenAI SDK instead.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

### 5. Build for Production

To create an optimized production build:

```bash
npm run build
```

### 6. Start Production Server

After building, start the production server:

```bash
npm start
```

The app will run on [http://localhost:3000](http://localhost:3000).

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/auth/register` | Register a new user | `{ name, email, password }` | `{ success, data: { token, user }, message }` |
| `POST` | `/api/auth/login` | Login existing user | `{ email, password }` | `{ success, data: { token, user }, message }` |

**Note:** All notes endpoints below require authentication. Include the JWT token in the `Authorization` header as `Bearer <token>`.

### Notes Endpoints

| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| `GET` | `/api/notes` | Get all notes (sorted by newest first) | - | `{ success, data: Note[], count }` | ✅ |
| `GET` | `/api/notes?q=term` | Search notes with query parameter | - | `{ success, data: Note[], count, searchQuery }` | ✅ |
| `POST` | `/api/notes` | Create a new note | `{ title, content, summary? }` | `{ success, data: Note, message }` | ✅ |
| `GET` | `/api/notes/[id]` | Get a single note by ID | - | `{ success, data: Note }` | ✅ |
| `PUT` | `/api/notes/[id]` | Update a note (auto-saves version) | `{ title?, content?, summary? }` | `{ success, data: Note }` | ✅ |
| `DELETE` | `/api/notes/[id]` | Delete a note | - | `{ success, message }` | ✅ |
| `GET` | `/api/notes/[id]/history` | Get version history for a note | - | `{ success, data: { versions, currentVersion } }` | ✅ |
| `POST` | `/api/notes/[id]/restore` | Restore a specific version | `{ versionNumber }` | `{ success, data: Note, message }` | ✅ |

### AI Summarization Endpoint

| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| `POST` | `/api/summarize` | Generate AI summary for note content | `{ noteId?, content? }` | `{ success, data: { summary } }` | ✅ |

**Note:** Provide either `noteId` (to summarize existing note) or `content` (to summarize arbitrary text).

## 📁 Project Structure

```
frontend/
├── pages/
│   ├── index.tsx                 # Home page - displays all notes
│   ├── login.tsx                 # User login page
│   ├── register.tsx              # User registration page
│   ├── _app.tsx                  # Next.js app wrapper with AuthProvider
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.ts         # Login endpoint (JWT generation)
│   │   │   └── register.ts      # Registration endpoint
│   │   ├── notes/
│   │   │   ├── index.ts         # GET all notes, POST new note
│   │   │   └── [id].ts          # GET/PUT/DELETE single note (with version tracking)
│   │   │   └── [id]/
│   │   │       ├── history.ts   # GET version history
│   │   │       └── restore.ts   # POST restore version
│   │   └── summarize.ts         # AI summarization endpoint
│   └── notes/
│       ├── new.tsx              # Create new note page
│       └── [id]/
│           └── edit.tsx         # Edit note page (with version history)
├── components/
│   ├── NoteCard.tsx             # Note card component with actions
│   ├── Modal.tsx                # Reusable modal component
│   ├── Toast.tsx                # Toast notification component
│   └── NoteHistoryModal.tsx     # Version history viewer with restore
├── contexts/
│   └── AuthContext.tsx          # Authentication context provider
├── models/
│   ├── Note.ts                  # Mongoose Note schema with versions
│   └── User.ts                  # Mongoose User schema with bcrypt
├── lib/
│   ├── api.ts                   # API helper functions with auth
│   ├── mongodb.ts               # MongoDB connection handler
│   ├── exportImport.ts          # Export/Import utility functions
│   └── env-check.ts             # Environment validation
├── styles/
│   └── globals.css              # Global Tailwind styles
└── package.json
```


## 🔍 Search & Filter Feature

The app includes an intelligent search system that automatically adapts based on your note collection size:

### How It Works
- **Small Collections (< 50 notes)**: Lightning-fast client-side filtering with instant results
- **Large Collections (≥ 50 notes)**: Efficient server-side MongoDB text search with weighted results
- **Debounced Input**: 300ms delay prevents excessive searches while typing
- **Visual Feedback**: Search indicator shows when querying, clear button appears when text is entered

### Search Capabilities
- Searches across **title**, **content**, and **summary** fields
- **Case-insensitive** matching
- **Weighted results**: Title matches rank higher than content matches
- **Automatic fallback**: Uses regex search if text index isn't available

### MongoDB Text Index
The app automatically creates a text index on your notes collection for optimal search performance:
```javascript
{
  title: 'text',    // Weight: 10 (highest priority)
  summary: 'text',  // Weight: 5 (medium priority)  
  content: 'text'   // Weight: 1 (standard priority)
}
```

For detailed search documentation, see [SEARCH_FEATURE.md](./SEARCH_FEATURE.md).

## 🧪 Testing the Application

### Manual Testing Steps:

1. **Test Authentication**
   ```
   - Navigate to /register
   - Register with name, email, password
   - Verify redirect to home after registration
   - Logout and test login with same credentials
   - Try accessing /notes/new without login (should redirect)
   - Verify JWT token stored in localStorage
   ```

2. **Test Note Creation**
   ```
   - Navigate to /notes/new
   - Try submitting empty form (should show validation)
   - Create valid note
   - Verify redirect and note appears on home
   ```

2. **Test AI Summarization**
   ```
   - Click Summarize on a note with content
   - Verify summary appears in blue box
   - Check that summary is saved (refresh page)
   ```

3. **Test Search**
   ```
   - Enter search term in home page
   - Verify debounce delay (300ms)
   - Check search indicator appears
   - Verify filtering works correctly
   - Test clear button (X)
   - Test with no results
   - Create 50+ notes to test server-side search mode
   ```

4. **Test Edit**
   ```
   - Click Edit on a note
   - Modify title and content
   - Save and verify changes persist
   ```

5. **Test Delete**
   ```
   - Click Delete on a note
   - Confirm in modal
   - Verify note is removed
   ```

6. **Test Version History**
   ```
   - Edit a note multiple times
   - Click "View History" button on edit page
   - Verify all versions are listed with timestamps
   - Click on a version card to view full details
   - Verify complete title, content, and summary displayed
   - Click "Restore This Version" 
   - Confirm restoration in modal
   - Verify note content reverted to selected version
   - Check that restoration creates a new version entry
   ```

7. **Test Dark Mode**
   ```
   - Toggle dark mode switch (if available)
   - Verify all components render correctly in dark theme
   - Test all modals and components in both themes
   ```

8. **Test Export/Import**
   ```
   - Click Export on a note card
   - Test TXT export - verify file downloads with correct content
   - Test Markdown export - verify formatting is preserved
   - Test PDF export - verify PDF generates with proper styling
   - Click "Export All" - verify all notes exported in one file
   - Click "Import Note" button
   - Upload a .txt or .md file
   - Verify preview modal shows correct content
   - Edit title/content if needed
   - Save and verify note appears in list
   - Test import with invalid file type (should show error)
   ```

## 🐛 Troubleshooting

### Authentication Issues
- **Error**: `Authentication required` on API calls
  - **Solution**: Ensure you're logged in and token exists in localStorage
  - Check browser console for token presence: `localStorage.getItem('token')`
- **Error**: `Invalid token`
  - **Solution**: Clear localStorage and login again
  - Token may have been tampered with or expired
- **Error**: User can't register
  - **Solution**: Check if email already exists, use unique email

### MongoDB Connection Issues
- **Error**: `MONGODB_URI is not defined`
  - **Solution**: Ensure `.env.local` exists with correct `MONGODB_URI`
- **Error**: `MongoServerError: Authentication failed`
  - **Solution**: Check username/password in connection string
- **Error**: `IP not whitelisted`
  - **Solution**: Add your IP address to MongoDB Atlas Network Access (or use `0.0.0.0/0` for development)

### Gemini API Issues
- **Error**: `Missing API key`
  - **Solution**: Add `GEMINI_API_KEY` to `.env.local`
- **Error**: `Model not found`
  - **Solution**: The app tries multiple models and falls back to simple summarization
- **Error**: `Rate limit exceeded`
  - **Solution**: Wait a few minutes or upgrade your Gemini API quota

### Build Issues
- **Error**: Module not found
  - **Solution**: Run `npm install` to ensure all dependencies are installed
- **Error**: TypeScript errors
  - **Solution**: Check `tsconfig.json` and ensure all TypeScript files are valid

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Keep API keys secure and rotate them regularly
- Use MongoDB Atlas IP whitelist in production
- Add rate limiting for production deployment
- Validate and sanitize all user inputs

## 🚢 Deployment

### Deploying to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
4. Deploy!

### Deploying to Other Platforms

The app can be deployed to any platform that supports Next.js:
- **Netlify** - Use Next.js adapter
- **AWS Amplify** - Configure build settings
- **Railway** - Connect GitHub repo
- **Render** - Use Docker or Node buildpack

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, MongoDB, and Google Gemini AI**
