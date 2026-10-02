const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const uri = 'mongodb+srv://codesrijan_db_user:mbSBS100Zj9kE5pX@codesrijan-cluster.mrckx43.mongodb.net/codesrijan?appName=codesrijan-cluster';

mongoose.connect(uri).then(async () => {
    const hash = await bcrypt.hash('password123', 10);
    await mongoose.connection.collection('users').updateOne(
        { email: 'admin@e2e.test' },
        { 
            $set: { 
                id: 'usr-admin-1', 
                name: 'Admin E2E', 
                email: 'admin@e2e.test', 
                passwordHash: hash, 
                role: 'admin', 
                accountStatus: 'active', 
                emailVerified: true 
            } 
        },
        { upsert: true }
    );
    console.log('Admin user created successfully in new DB!');
    process.exit(0);
}).catch(e => {
    console.error('Failed:', e);
    process.exit(1);
});
