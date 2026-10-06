import axios from 'axios';

(async () => {
    try {
        const email = "varunsehgal2005@gmail.com";
        console.log(`Dispatching OTP email to ${email} via live server Gmail SMTP...`);
        const res = await axios.post("http://localhost:5001/api/auth/resend-otp", { email });
        console.log("Response:", res.data);
        console.log("SUCCESS: OTP Code generated and sent to Gmail inbox:", res.data.testOtp);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e.response?.data || e.message);
        process.exit(1);
    }
})();
