const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const NOTES_FILE = path.join(__dirname, 'notes.json');

// Middleware
app.use(express.json());

// Utility functions
const readNotesFile = async () => {
  try {
    const data = await fs.readFile(NOTES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create empty array
      await writeNotesFile([]);
      return [];
    }
    throw error;
  }
};

const writeNotesFile = async (notes) => {
  await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));
};

const validateNote = (title, content) => {
  const errors = [];
  
  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push('Title is required and must be a non-empty string');
  } else if (title.length > 100) {
    errors.push('Title must be 100 characters or less');
  }
  
  if (!content || typeof content !== 'string' || content.trim() === '') {
    errors.push('Content is required and must be a non-empty string');
  }
  
  return errors;
};

// Routes

// GET /notes - List all notes with filters
app.get('/notes', async (req, res) => {
  try {
    const notes = await readNotesFile();
    const { page = 1, limit = 10, search, includeDeleted = 'false' } = req.query;
    
    let filteredNotes = notes;
    
    // Filter out deleted notes unless includeDeleted is true
    if (includeDeleted !== 'true') {
      filteredNotes = filteredNotes.filter(note => !note.deleted);
    }
    
    // Search functionality
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) || 
        note.content.toLowerCase().includes(searchTerm)
      );
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedNotes = filteredNotes.slice(startIndex, endIndex);
    
    res.json({
      notes: paginatedNotes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredNotes.length,
        totalPages: Math.ceil(filteredNotes.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error reading notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /notes/:id - Get a single note by ID
app.get('/notes/:id', async (req, res) => {
  try {
    const notes = await readNotesFile();
    const note = notes.find(n => n.id === req.params.id);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    if (note.deleted) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Error reading note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /notes - Create a new note
app.post('/notes', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // Validation
    const validationErrors = validateNote(title, content);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    // Create new note
    const newNote = {
      id: uuidv4(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      deleted: false
    };
    
    // Read existing notes and add new one
    const notes = await readNotesFile();
    notes.push(newNote);
    
    // Write back to file
    await writeNotesFile(notes);
    
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /notes/:id - Update a note
app.put('/notes/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const noteId = req.params.id;
    
    // Validation
    const validationErrors = validateNote(title, content);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    // Read notes
    const notes = await readNotesFile();
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    if (notes[noteIndex].deleted) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Update note
    notes[noteIndex] = {
      ...notes[noteIndex],
      title: title.trim(),
      content: content.trim()
    };
    
    // Write back to file
    await writeNotesFile(notes);
    
    res.json(notes[noteIndex]);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /notes/:id - Soft delete a note
app.delete('/notes/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    
    // Read notes
    const notes = await readNotesFile();
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    if (notes[noteIndex].deleted) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Soft delete - set deleted flag to true
    notes[noteIndex].deleted = true;
    
    // Write back to file
    await writeNotesFile(notes);
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Notes API server running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET    /notes - List all notes`);
  console.log(`  GET    /notes/:id - Get single note`);
  console.log(`  POST   /notes - Create new note`);
  console.log(`  PUT    /notes/:id - Update note`);
  console.log(`  DELETE /notes/:id - Delete note`);
});

module.exports = app;