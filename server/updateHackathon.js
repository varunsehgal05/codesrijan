import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Hackathon } from './models/index.js';

dotenv.config();

const update = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const hId = 'hack-demo-2';
        const result = await Hackathon.findOneAndUpdate(
            { id: hId },
            {
                $set: {
                    status: 'active',
                    registrationStart: new Date(Date.now() - 86400000 * 5),
                    registrationEnd: new Date(Date.now() + 86400000 * 5),
                    startDate: new Date(Date.now() - 86400000 * 2),
                    endDate: new Date(Date.now() + 86400000 * 5),
                }
            },
            { new: true }
        );
        
        if (result) {
            console.log('Updated hack-demo-2 successfully:', result.status, result.registrationStart, result.registrationEnd);
        } else {
            console.log('Hackathon hack-demo-2 not found!');
        }

        process.exit(0);
    } catch (e) {
        console.error('Failed:', e);
        process.exit(1);
    }
};

update();
