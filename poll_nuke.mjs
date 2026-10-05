import axios from 'axios';

async function waitAndNuke() {
    console.log("Waiting for Render to deploy and then wiping the DB...");
    for (let i = 0; i < 60; i++) {
        try {
            const res = await axios.get('https://codesrijan-api-6tfr.onrender.com/api/nuke-users');
            if (res.data.message === "Nuked") {
                console.log("Successfully wiped database! Deleted count:", res.data.deletedCount);
                return;
            }
        } catch (e) {
            console.log(`Attempt ${i+1}: Not deployed yet. Waiting 10s...`);
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
    console.error("Failed to reach endpoint after 5 minutes.");
}
waitAndNuke();
