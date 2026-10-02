import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function run() {
    await mongoose.connect("mongodb+srv://codesrijan_backend:CodeSrijan2026Pass123!@codesrijan-cluster.lhtpmxf.mongodb.net/?appName=codesrijan-cluster");
    const user = await mongoose.connection.collection('users').findOne({ email: 'admin@e2e.test' });
    console.log("Found user:", user);
    if(user) {
        const isValid = await bcrypt.compare("password123", user.passwordHash);
        console.log("Password valid:", isValid);
    }
    process.exit(0);
}
run();
