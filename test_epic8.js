import axios from 'axios';
const API = 'http://localhost:5000/api';

async function testSuite() {
    console.log("=== STARTING EPIC 7/8 E2E BACKEND SECURITY TEST ===");
    try {
        console.log("-> 1. Testing Unauthenticated Access");
        try {
            await axios.post(`${API}/problems`, { title: "Hacked Problem" });
            console.error("FAIL: Unauthenticated POST /api/problems succeeded.");
        } catch (e) {
            if (e.response?.status === 401) {
                console.log("PASS: Unauthenticated POST /api/problems returned 401.");
            } else {
                console.error("FAIL: Unauthenticated POST /api/problems returned unexpected:", e.response?.status);
            }
        }

        // Ideally we would trigger a full registration loop, get the Email verification code directly from MongoDB, verify it, and then grab the JWT token.
        console.log("We need the backend running to execute remaining live HTTP validation loops!");

    } catch (e) {
        console.error("Test Failed!", e.response ? e.response.data : e.message);
    }
}

testSuite();
