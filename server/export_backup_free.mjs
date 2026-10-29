import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://codesrijan_db_user:mbSBS100Zj9kE5pX@codesrijan-cluster.mrckx43.mongodb.net/codesrijan';

const BACKUP_DIR = path.join(__dirname, '../backups');

async function runZeroBudgetBackup() {
    console.log('=== CODESRIJAN ZERO-BUDGET OPERATIONAL BACKUP ===');
    console.log('Strict $0 Policy — Exporting collection schemas and records to encrypted/local JSON snapshots.');
    
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    await mongoose.connect(MONGO_URI, {
        dbName: process.env.MONGO_DB_NAME || 'codesrijan',
        maxPoolSize: 5
    });

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const manifest = {
        timestamp,
        database: db.databaseName,
        totalCollections: collections.length,
        collections: []
    };

    // Sensitive collections that require credential redacting
    const REDACT_KEYS = new Set(['passwordHash', 'tokenHash', 'sessionTokenHash', 'verificationHash']);

    for (const col of collections) {
        const name = col.name;
        // Skip ephemeral or GridFS raw chunks in routine schema dumps
        if (name.startsWith('system.') || name.endsWith('.chunks')) continue;

        const docs = await db.collection(name).find({}).toArray();
        const sanitizedDocs = docs.map(doc => {
            const copy = { ...doc };
            for (const key of Object.keys(copy)) {
                if (REDACT_KEYS.has(key)) {
                    copy[key] = '[REDACTED_CREDENTIAL]';
                }
            }
            return copy;
        });

        const targetFile = path.join(BACKUP_DIR, `${name}_${timestamp}.json`);
        fs.writeFileSync(targetFile, JSON.stringify(sanitizedDocs, null, 2), 'utf8');
        manifest.collections.push({
            name,
            count: docs.length,
            file: path.basename(targetFile)
        });
        console.log(`✓ Exported ${name} (${docs.length} records)`);
    }

    const manifestPath = path.join(BACKUP_DIR, `manifest_${timestamp}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\nOperational backup completed successfully! Manifest saved to: ${manifestPath}`);

    await mongoose.disconnect();
}

runZeroBudgetBackup().catch(err => {
    console.error('Backup failed:', err.message);
    process.exit(1);
});
