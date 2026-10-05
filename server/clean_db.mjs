import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = 'mongodb+srv://codesrijan_db_user:mbSBS100Zj9kE5pX@codesrijan-cluster.mrckx43.mongodb.net/codesrijan?appName=codesrijan-cluster';

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users'); // collection name users

async function cleanDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} total users.`);

        const keepEmails = [
            'admin@codesrijan.com',
            'student@codesrijan.com',
            'varunsehgal2005@gmail.com',
            'varunsehgal2005@gmial.com',
            'varunsehgal2005@ggmial.com' // keeping typos just in case
        ];

        const usersToDelete = users.filter(u => !keepEmails.includes(u.email));
        
        console.log(`Deleting ${usersToDelete.length} users...`);
        for (const u of usersToDelete) {
            await User.findByIdAndDelete(u._id);
        }

        console.log('Cleaned DB successfully.');
        
        // Let's inspect the varunsehgal user
        const varunUser = await User.findOne({ email: { $regex: 'varunsehgal', $options: 'i' } });
        if (varunUser) {
            console.log('Varun User Details:', varunUser.toObject());
        } else {
            console.log('Varun user not found in DB at all!');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
cleanDB();
