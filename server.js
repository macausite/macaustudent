const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage (replace with database in production)
const tutors = [];
const students = [];
const matches = [];

// Register a tutor
app.post('/api/tutors', (req, res) => {
  const { name, subject, availability, hourlyRate, bio } = req.body;
  
  if (!name || !subject || !availability) {
    return res.status(400).json({ error: 'Name, subject, and availability are required' });
  }
  
  const tutor = {
    id: uuidv4(),
    name,
    subject,
    availability,
    hourlyRate: hourlyRate || 0,
    bio: bio || '',
    createdAt: new Date().toISOString()
  };
  
  tutors.push(tutor);
  res.status(201).json(tutor);
});

// Register a student
app.post('/api/students', (req, res) => {
  const { name, subject, preferredAvailability, budget, bio } = req.body;
  
  if (!name || !subject) {
    return res.status(400).json({ error: 'Name and subject are required' });
  }
  
  const student = {
    id: uuidv4(),
    name,
    subject,
    preferredAvailability: preferredAvailability || [],
    budget: budget || 0,
    bio: bio || '',
    createdAt: new Date().toISOString()
  };
  
  students.push(student);
  res.status(201).json(student);
});

// Get all tutors
app.get('/api/tutors', (req, res) => {
  const { subject } = req.query;
  let filteredTutors = tutors;
  
  if (subject) {
    filteredTutors = tutors.filter(t => 
      t.subject.toLowerCase() === subject.toLowerCase()
    );
  }
  
  res.json(filteredTutors);
});

// Get all students
app.get('/api/students', (req, res) => {
  const { subject } = req.query;
  let filteredStudents = students;
  
  if (subject) {
    filteredStudents = students.filter(s => 
      s.subject.toLowerCase() === subject.toLowerCase()
    );
  }
  
  res.json(filteredStudents);
});

// Match algorithm - find compatible tutors for a student
app.post('/api/match', (req, res) => {
  const { studentId } = req.body;
  
  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required' });
  }
  
  const student = students.find(s => s.id === studentId);
  
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  // Find matching tutors based on subject and availability
  const matchedTutors = tutors.filter(tutor => {
    const subjectMatch = tutor.subject.toLowerCase() === student.subject.toLowerCase();
    const budgetMatch = student.budget === 0 || tutor.hourlyRate <= student.budget;
    
    // Check availability overlap (simplified check)
    const availabilityMatch = student.preferredAvailability.length === 0 || 
      student.preferredAvailability.some(pref => 
        tutor.availability.includes(pref)
      );
    
    return subjectMatch && budgetMatch && availabilityMatch;
  });
  
  const match = {
    id: uuidv4(),
    studentId: student.id,
    studentName: student.name,
    matchedTutors: matchedTutors.map(t => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      hourlyRate: t.hourlyRate,
      availability: t.availability,
      bio: t.bio
    })),
    matchedAt: new Date().toISOString()
  };
  
  matches.push(match);
  res.json(match);
});

// Get all matches
app.get('/api/matches', (req, res) => {
  res.json(matches);
});

// Get a specific match
app.get('/api/matches/:matchId', (req, res) => {
  const { matchId } = req.params;
  const match = matches.find(m => m.id === matchId);
  
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }
  
  res.json(match);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tutor-Student Matching Service is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎓 Tutor-Student Matching Service running on port ${PORT}`);
  console.log(`📚 Endpoints:`);
  console.log(`   POST /api/tutors - Register a tutor`);
  console.log(`   POST /api/students - Register a student`);
  console.log(`   GET /api/tutors - Get all tutors (optional ?subject=)`);
  console.log(`   GET /api/students - Get all students (optional ?subject=)`);
  console.log(`   POST /api/match - Find matches for a student`);
  console.log(`   GET /api/matches - Get all matches`);
  console.log(`   GET /api/health - Health check`);
});
