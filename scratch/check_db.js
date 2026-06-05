import fetch from 'node-fetch';

(async () => {
  try {
    const API_URL = 'http://127.0.0.1:5001/demo-macaustudent/us-central1/api';
    console.log("Fetching tutors...");
    const tutorsRes = await fetch(`${API_URL}/tutors`);
    const tutors = await tutorsRes.json();
    console.log("TUTORS:");
    console.log(JSON.stringify(tutors, null, 2));

    console.log("\nFetching bookings...");
    const bookingsRes = await fetch(`${API_URL}/bookings`);
    const bookings = await bookingsRes.json();
    console.log("BOOKINGS:");
    console.log(JSON.stringify(bookings, null, 2));
  } catch (err) {
    console.error("Error fetching data:", err);
  }
})();
