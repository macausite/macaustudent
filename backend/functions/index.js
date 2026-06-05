const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// Enable CORS for frontend domains
app.use(cors({ origin: true }));
app.use(express.json());

// Disable caching for all API responses to avoid browser caching issues in tests
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

const DB_PATH = process.env.FUNCTIONS_EMULATOR === "true"
  ? "/Users/roberto/Documents/workspace/macaustudent/backend/db.json"
  : path.join("/tmp", "db.json");

// Default initial datasets
const DEFAULT_TUTORS = [
  {
    id: "t1",
    name: "Dr. Sofia Sou",
    subjects: ["Math", "Physics"],
    rate: 350,
    rating: 4.9,
    education: "Ph.D. in Mathematics, University of Macau (UM)",
    location: "Taipa",
    bio: "Experienced university lecturer specializing in secondary school calculus, matrices, and college algebra preparation.",
    availableSlots: ["Sat 10:00 - 12:00", "Sat 14:00 - 16:00", "Sun 10:00 - 12:00"],
    curriculums: ["International System (IB / IGCSE / A-Levels)", "Macao / Mainland System (Joint Admission Exam / DSE)"],
    reviews: [
      { student: "Pedro M.", rating: 5, text: "Excellent tutor! Sofia breaks down complex linear algebra into simple visual steps." },
      { student: "Katrina L.", rating: 5, text: "Helped me boost my math exam grade from C to A." }
    ],
    isApproved: true
  },
  {
    id: "t2",
    name: "Mr. Lucas Chao",
    subjects: ["English", "Portuguese"],
    rate: 250,
    rating: 4.7,
    education: "B.A. in English Studies, Macao University of Tourism (UTM)",
    location: "Macau Peninsula",
    bio: "Trilingual native speaker offering practical speaking sessions, IELTS/Cambridge exam preparation, and school syllabus support.",
    availableSlots: ["Mon 18:00 - 20:00", "Wed 18:00 - 20:00", "Fri 17:00 - 19:00"],
    curriculums: ["Portuguese System (Exame Nacional / Ensino Secundário)", "International System (IB / IGCSE / A-Levels)"],
    reviews: [
      { student: "Vasco S.", rating: 4, text: "Very friendly and engaging Portuguese speaking practice!" }
    ],
    isApproved: true
  },
  {
    id: "t3",
    name: "Ms. Chloe Wong",
    subjects: ["Chemistry", "Biology"],
    rate: 300,
    rating: 4.8,
    education: "M.Sc. in Biochemistry, Macau University of Science and Technology (MUST)",
    location: "Taipa",
    bio: "Interactive biology and chemistry prep. Focuses on molecular structures and cellular biology with dynamic visual presentations.",
    availableSlots: ["Sat 09:00 - 11:00", "Sun 15:00 - 17:00"],
    curriculums: ["International System (IB / IGCSE / A-Levels)"],
    reviews: [
      { student: "Alice K.", rating: 5, text: "Super structured lessons! Highly recommend Chloe for IB Biology." }
    ],
    isApproved: true
  },
  {
    id: "t4",
    name: "Mr. Ryan Lao",
    subjects: ["Coding", "Math"],
    rate: 280,
    rating: 4.6,
    education: "B.Sc. in Computer Science, University of Saint Joseph (USJ)",
    location: "Coloane",
    bio: "Python, web development, and database fundamentals. Perfect for secondary school coding classes and absolute beginners.",
    availableSlots: ["Fri 19:00 - 21:00", "Sat 16:00 - 18:00"],
    curriculums: ["Macao / Mainland System (Joint Admission Exam / DSE)"],
    reviews: [],
    isApproved: true
  }
];

const DEFAULT_BOOKINGS = [
  {
    id: "b1",
    tutorId: "t1",
    tutorName: "Dr. Sofia Sou",
    studentName: "Roberto",
    dateTime: "Sat 14:00 - 16:00",
    subject: "Math",
    status: "confirmed"
  },
  {
    id: "b2",
    tutorId: "t3",
    tutorName: "Ms. Chloe Wong",
    studentName: "Roberto",
    dateTime: "Sun 15:00 - 17:00",
    subject: "Chemistry",
    status: "pending"
  }
];

const DEFAULT_REQUESTS = [
  {
    id: "r1",
    title: "Need IELTS Speaking Prep",
    subject: "English",
    budget: 220,
    date: "2026-06-04",
    description: "Looking for an English tutor for mock speaking tests once a week. Flexible weekday evening schedules."
  },
  {
    id: "r2",
    title: "UM Math Entrance Exam Review",
    subject: "Math",
    budget: 320,
    date: "2026-06-03",
    description: "Need urgent crash course in trigonometry and geometry before the entrance exam. Weekend Taipa sessions preferred."
  }
];

// Active database in-memory objects (default initialization)
let tutors = JSON.parse(JSON.stringify(DEFAULT_TUTORS));
let bookings = JSON.parse(JSON.stringify(DEFAULT_BOOKINGS));
let matchRequests = JSON.parse(JSON.stringify(DEFAULT_REQUESTS));

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      if (data.tutors) tutors = data.tutors;
      if (data.bookings) bookings = data.bookings;
      if (data.matchRequests) matchRequests = data.matchRequests;
    } else {
      saveDb();
    }
  } catch (err) {
    console.error("Error loading DB: ", err);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify({ tutors, bookings, matchRequests }, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving DB: ", err);
  }
}

// Tutors endpoints
app.get("/tutors", (req, res) => {
  loadDb();
  res.json(tutors);
});

app.post("/tutors", (req, res) => {
  loadDb();
  const { name, subjects, rate, education, location, bio, availableSlots, curriculums } = req.body;
  if (!name || !subjects || !rate || !education || !location || !bio || !availableSlots || !curriculums) {
    return res.status(400).json({ error: "Missing required tutor registration details" });
  }

  const newTutor = {
    id: "t" + Date.now().toString(),
    name,
    subjects: Array.isArray(subjects) ? subjects : [subjects],
    rate: Number(rate),
    rating: 5.0,
    education,
    location,
    bio,
    availableSlots: Array.isArray(availableSlots) ? availableSlots : [availableSlots],
    curriculums: Array.isArray(curriculums) ? curriculums : [curriculums],
    isApproved: false,
    reviews: []
  };

  tutors.push(newTutor);
  saveDb();
  res.status(201).json(newTutor);
});

app.put("/tutors/:id", (req, res) => {
  loadDb();
  const { id } = req.params;
  const { name, subjects, rate, education, location, bio, availableSlots, curriculums, isApproved } = req.body;
  const index = tutors.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Tutor not found" });
  }
  
  if (name !== undefined) tutors[index].name = name;
  if (subjects !== undefined) tutors[index].subjects = Array.isArray(subjects) ? subjects : [subjects];
  if (rate !== undefined) tutors[index].rate = Number(rate);
  if (education !== undefined) tutors[index].education = education;
  if (location !== undefined) tutors[index].location = location;
  if (bio !== undefined) tutors[index].bio = bio;
  if (availableSlots !== undefined) tutors[index].availableSlots = Array.isArray(availableSlots) ? availableSlots : [availableSlots];
  if (curriculums !== undefined) tutors[index].curriculums = Array.isArray(curriculums) ? curriculums : [curriculums];
  if (isApproved !== undefined) tutors[index].isApproved = (isApproved === true || isApproved === 'true');

  saveDb();
  res.json(tutors[index]);
});

app.delete("/tutors/:id", (req, res) => {
  loadDb();
  const { id } = req.params;
  const initialLength = tutors.length;
  tutors = tutors.filter(t => t.id !== id);
  if (tutors.length === initialLength) {
    return res.status(404).json({ error: "Tutor not found" });
  }
  saveDb();
  res.json({ success: true, message: `Tutor ${id} deleted` });
});

// Bookings endpoints
app.get("/bookings", (req, res) => {
  loadDb();
  res.json(bookings);
});

app.post("/bookings", (req, res) => {
  loadDb();
  const { tutorId, tutorName, subject, dateTime, studentName } = req.body;
  if (!tutorId || !tutorName || !subject || !dateTime) {
    return res.status(400).json({ error: "Missing required booking details" });
  }
  
  const newBooking = {
    id: Date.now().toString(),
    tutorId,
    tutorName,
    studentName: studentName || "Roberto",
    dateTime,
    subject,
    status: "pending"
  };
  
  bookings.push(newBooking);
  saveDb();
  res.status(201).json(newBooking);
});

app.put("/bookings/:id", (req, res) => {
  loadDb();
  const { id } = req.params;
  const { status, studentName, subject, dateTime } = req.body;
  
  const bookingIndex = bookings.findIndex(b => b.id === id);
  if (bookingIndex === -1) {
    return res.status(404).json({ error: "Booking not found" });
  }
  
  if (status !== undefined) bookings[bookingIndex].status = status;
  if (studentName !== undefined) bookings[bookingIndex].studentName = studentName;
  if (subject !== undefined) bookings[bookingIndex].subject = subject;
  if (dateTime !== undefined) bookings[bookingIndex].dateTime = dateTime;
  
  saveDb();
  res.json(bookings[bookingIndex]);
});

app.delete("/bookings/:id", (req, res) => {
  loadDb();
  const { id } = req.params;
  const initialLength = bookings.length;
  bookings = bookings.filter(b => b.id !== id);
  if (bookings.length === initialLength) {
    return res.status(404).json({ error: "Booking not found" });
  }
  saveDb();
  res.json({ success: true, message: `Booking ${id} deleted` });
});

// Match Requests endpoints ("Tutor Needed")
app.get("/requests", (req, res) => {
  loadDb();
  res.json(matchRequests);
});

app.post("/requests", (req, res) => {
  loadDb();
  const { title, subject, budget, description } = req.body;
  if (!title || !subject || !budget || !description) {
    return res.status(400).json({ error: "Missing required request details" });
  }
  
  const newRequest = {
    id: Date.now().toString(),
    title,
    subject,
    budget: Number(budget),
    date: new Date().toISOString().split("T")[0],
    description
  };
  
  matchRequests.push(newRequest);
  saveDb();
  res.status(201).json(newRequest);
});

app.delete("/requests/:id", (req, res) => {
  loadDb();
  const { id } = req.params;
  const initialLength = matchRequests.length;
  matchRequests = matchRequests.filter(reqItem => reqItem.id !== id);
  
  if (matchRequests.length === initialLength) {
    return res.status(404).json({ error: "Match request not found" });
  }
  saveDb();
  res.json({ success: true, message: `Match request ${id} deleted` });
});

app.put("/requests/:id", (req, res) => {
  loadDb();
  const { id } = req.params;
  const { title, subject, budget, description } = req.body;
  const index = matchRequests.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Match request not found" });
  }

  if (title !== undefined) matchRequests[index].title = title;
  if (subject !== undefined) matchRequests[index].subject = subject;
  if (budget !== undefined) matchRequests[index].budget = Number(budget);
  if (description !== undefined) matchRequests[index].description = description;

  saveDb();
  res.json(matchRequests[index]);
});

// Reset endpoint
app.post("/reset", (req, res) => {
  tutors = JSON.parse(JSON.stringify(DEFAULT_TUTORS));
  bookings = JSON.parse(JSON.stringify(DEFAULT_BOOKINGS));
  matchRequests = JSON.parse(JSON.stringify(DEFAULT_REQUESTS));
  saveDb();
  res.json({ success: true, message: "Database reset to default mock data" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", api: "macaustudent-backend", version: "1.0.0" });
});

// Export Cloud Function API
exports.api = onRequest({ cors: true }, app);
