# 🎓 Tutor-Student Matching Service

A web service that matches tutors with students based on subject, availability, and budget.

## Features

- **Register Tutors**: Add tutor profiles with subjects, availability, rates, and bio
- **Register Students**: Add student profiles with subjects they need help with, preferred availability, and budget
- **Smart Matching**: Automatically find compatible tutors for students based on:
  - Subject expertise
  - Budget compatibility
  - Availability overlap
- **RESTful API**: Easy-to-use REST endpoints

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

The service will run on `http://localhost:3000` by default.

## API Endpoints

### Health Check
```
GET /api/health
```

### Register a Tutor
```
POST /api/tutors
Content-Type: application/json

{
  "name": "John Doe",
  "subject": "Mathematics",
  "availability": ["Monday", "Wednesday", "Friday"],
  "hourlyRate": 50,
  "bio": "Experienced math tutor with 5 years of teaching"
}
```

### Register a Student
```
POST /api/students
Content-Type: application/json

{
  "name": "Jane Smith",
  "subject": "Mathematics",
  "preferredAvailability": ["Monday", "Wednesday"],
  "budget": 60,
  "bio": "High school student preparing for exams"
}
```

### Get All Tutors
```
GET /api/tutors
GET /api/tutors?subject=Mathematics
```

### Get All Students
```
GET /api/students
GET /api/students?subject=Mathematics
```

### Find Matches for a Student
```
POST /api/match
Content-Type: application/json

{
  "studentId": "student-uuid-here"
}
```

### Get All Matches
```
GET /api/matches
```

### Get Specific Match
```
GET /api/matches/:matchId
```

## Example Usage

### 1. Register a Tutor
```bash
curl -X POST http://localhost:3000/api/tutors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "subject": "Physics",
    "availability": ["Tuesday", "Thursday", "Saturday"],
    "hourlyRate": 45,
    "bio": "PhD in Physics, passionate about teaching"
  }'
```

### 2. Register a Student
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Wilson",
    "subject": "Physics",
    "preferredAvailability": ["Tuesday", "Thursday"],
    "budget": 50,
    "bio": "College student needing help with quantum mechanics"
  }'
```

### 3. Find Matches
```bash
curl -X POST http://localhost:3000/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "<student-id-from-step-2>"
  }'
```

## Project Structure

```
/workspace
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## Notes

- This is a demo service using in-memory storage. For production use, replace with a database (MongoDB, PostgreSQL, etc.)
- The matching algorithm can be enhanced with more sophisticated criteria
- Consider adding authentication and authorization for production use

## License

ISC
