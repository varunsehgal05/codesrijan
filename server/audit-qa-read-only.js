// One-off read-only audit of the explicitly identified CodeSrijan cluster.
import fs from 'node:fs';
import { MongoClient } from 'mongodb';
if (!process.argv.includes('--read-only')) throw new Error('Explicit --read-only required.');
const uri = process.env.MONGO_URI;
if (!uri || new URL(uri).hostname !== 'codesrijan-cluster.mrckx43.mongodb.net') throw new Error('Intended cluster configuration unavailable.');
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000, readPreference: 'secondaryPreferred' });
try {
  await client.connect();
  const db = client.db('codesrijan');
  const events = await db.collection('hackathons').find({ id: /^qa-(paid|free)-hack-/ }, { projection: { _id: 0, id: 1, name: 1, status: 1, entryType: 1 } }).maxTimeMS(10000).toArray();
  const inventory = [];
  for (const event of events) {
    const registrations = await db.collection('registrations').find({ hackathonId: event.id }, { projection: { _id: 0, id: 1, userId: 1, teamId: 1, rosterMembers: 1, status: 1, paymentStatus: 1, transactionReference: 1, paymentProofUrl: 1, reviewHistory: 1, feeAmount: 1, currency: 1 } }).maxTimeMS(10000).toArray();
    const rows = [];
    for (const r of registrations) {
      const team = r.teamId ? await db.collection('teams').findOne({ id: r.teamId }, { projection: { leaderId: 1, memberIds: 1, isLocked: 1 } }) : null;
      const ids = [...new Set([r.userId, ...(r.rosterMembers || []).map(x => x.userId), ...(team?.memberIds || []), team?.leaderId].filter(Boolean))];
      const users = await db.collection('users').find({ id: { $in: ids } }, { projection: { email: 1 } }).toArray();
      const knownQA = users.length === ids.length && users.every(u => /^(?:student|hacker[1-6])@codesrijan\.com$/.test(u.email || ''));
      const other = r.teamId ? await db.collection('registrations').countDocuments({ teamId: r.teamId, hackathonId: { $ne: event.id }, rosterLocked: true }) : 0;
      rows.push({ id: r.id, teamId: r.teamId || null, status: r.status, paymentStatus: r.paymentStatus, proofPresent: !!r.paymentProofUrl, testReference: /^(?:TEST|QA)[-_]/i.test(r.transactionReference || ''), reviewStates: (r.reviewHistory || []).map(x => x.status), feeAmount: r.feeAmount, currency: r.currency, participantCount: ids.length, allParticipantsDesignatedQA: knownQA, teamLocked: !!team?.isLocked, otherLockedRegistrations: other });
    }
    inventory.push({ ...event, registrations: rows, mutationApplied: false });
  }
  fs.writeFileSync(new URL('../docs/QA_RECORD_INVENTORY.json', import.meta.url), JSON.stringify({ readOnly: true, reviewedAt: new Date().toISOString(), events: inventory }, null, 2));
  console.log(JSON.stringify({ eventsReviewed: inventory.length, registrationsReviewed: inventory.reduce((n,e) => n+e.registrations.length,0), mutationApplied: false }));
} catch {
  console.error('Read-only QA inventory unavailable; connection/query details withheld.');
  process.exitCode = 1;
} finally { await client.close(); }
