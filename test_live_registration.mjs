import axios from 'axios';

async function testRegistration() {
    console.log("Testing Registration on Live Server...");
    try {
        const res = await axios.post('https://codesrijan-api-6tfr.onrender.com/api/auth/register', {
            name: "Varun Sehgal",
            email: "varunsehgal2005@gmail.com",
            password: "Password123!",
            role: "student",
            college: "Test Institute",
            branch: "CSE",
            year: "3"
        });
        console.log("Success:", res.data);
    } catch (e) {
        if (e.response) {
            console.error("Error Response:", e.response.data);
        } else {
            console.error("Network Error:", e.message);
        }
    }
}
testRegistration();
