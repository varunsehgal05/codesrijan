// server/migrate-qa-data.mjs
// Robust, non-destructive migration script for classifying verified QA records with isTest: true.
// DRY RUN by default. Applying requires BOTH --apply, --confirm-target=<db_name>, AND --confirm-cluster=<cluster_hostname>.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

export const VERIFIED_QA_EVENT_IDS = [
  'qa-paid-hack-1792650687843',
  'qa-free-hack-1792650689462',
  'qa-paid-hack-1792650786332',
  'qa-free-hack-1792650787439',
  'qa-paid-hack-1792650910884',
  'qa-free-hack-1792650912102',
  'qa-paid-hack-1792695285658',
  'qa-free-hack-1792695286924'
];

// Historical teams identified as having ambiguous ownership or cross-event references
export const HISTORICAL_AMBIGUOUS_TEAMS = [
  't-1791543889807'
];

export function getSanitizedHost(uriString) {
  try {
    const raw = String(uriString || '');
    const normalized = raw.replace(/^mongodb(\+srv)?:\/\//, 'http://');
    const parsed = new URL(normalized);
    return parsed.hostname;
  } catch {
    return null;
  }
}

function getCliArg(prefix) {
  const match = process.argv.find(a => a.startsWith(prefix));
  return match ? match.split('=')[1] : null;
}

export async function runMigration(options = {}) {
  const uri = options.mongoUri || process.env.MONGO_URI || process.env.TEST_MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI must be configured.');
  }

  const isApply = Boolean(options.apply || process.argv.includes('--apply'));
  const confirmTarget = options.confirmTarget || getCliArg('--confirm-target');
  const confirmCluster = options.confirmCluster || getCliArg('--confirm-cluster');

  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    await mongoose.connect(uri);
  }

  const activeDbName = mongoose.connection.db ? mongoose.connection.db.databaseName : mongoose.connection.name;
  const activeHost = getSanitizedHost(uri) || mongoose.connection.host || 'unknown-host';

  // Strict Multi-Factor Target Guard for Apply Mode
  if (isApply) {
    if (!confirmTarget) {
      throw new Error(`Execution aborted. --apply requires explicit --confirm-target=<database_name> matching active connection (${activeDbName}).`);
    }
    if (confirmTarget !== activeDbName) {
      throw new Error(`Execution aborted. Target database mismatch. Specified target '${confirmTarget}' does not match active connection database '${activeDbName}'.`);
    }
    if (!confirmCluster) {
      throw new Error(`Execution aborted. --apply requires explicit --confirm-cluster=<cluster_hostname> matching active cluster (${activeHost}). A matching database name alone is insufficient.`);
    }
    if (confirmCluster !== activeHost) {
      throw new Error(`Execution aborted. Cluster host mismatch. Specified cluster '${confirmCluster}' does not match active connection cluster '${activeHost}'. Refusing apply.`);
    }
  }

  const Hackathon = mongoose.models.Hackathon || mongoose.model('Hackathon', new mongoose.Schema({}, { strict: false }));
  const Registration = mongoose.models.Registration || mongoose.model('Registration', new mongoose.Schema({}, { strict: false }));
  const Team = mongoose.models.Team || mongoose.model('Team', new mongoose.Schema({}, { strict: false }));
  const Project = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
  const Submission = mongoose.models.Submission || mongoose.model('Submission', new mongoose.Schema({}, { strict: false }));

  // 1. Locate allowlisted QA hackathons
  const hackathons = await Hackathon.find({
    id: { $in: VERIFIED_QA_EVENT_IDS }
  }).select('id name title status entryType fee isTest').lean();

  if (hackathons.length > 8) {
    throw new Error(`Census anomaly detected: Found ${hackathons.length} hackathons for allowlisted IDs (expected <= 8). Aborting for safety.`);
  }

  // Safety Anomaly Check: Check for rogue QA hackathons not in the allowlist
  const rogueHackathons = await Hackathon.find({
    id: { $regex: /^qa[-_]/i, $nin: VERIFIED_QA_EVENT_IDS }
  }).select('id name').lean();

  if (rogueHackathons.length > 0) {
    throw new Error(`Census anomaly detected: Found ${rogueHackathons.length} rogue QA hackathons not in the allowlist: ${rogueHackathons.map(h => h.id).join(', ')}. Aborting migration for safety.`);
  }

  // 2. Locate registrations associated with allowlisted QA hackathons
  const registrations = await Registration.find({
    hackathonId: { $in: VERIFIED_QA_EVENT_IDS }
  }).select('id hackathonId userId teamId status paymentStatus transactionReference feeAmount currency isTest').lean();

  if (registrations.length > 6) {
    throw new Error(`Census anomaly detected: Found ${registrations.length} registrations for allowlisted QA events (expected <= 6). Aborting migration for safety.`);
  }

  // 3. Dependency Analysis for Associated Teams
  const rawTeamIds = [...new Set(registrations.map(r => r.teamId).filter(Boolean))];
  const teams = await Team.find({
    id: { $in: rawTeamIds }
  }).select('id name isLocked isTest bonusPoints penaltyPoints').lean();

  const teamAnalysis = [];
  const eligibleTeamIds = [];
  const unresolvedTeamIds = [];

  for (const team of teams) {
    // Check all registrations across the entire DB for this team
    const allRegsForTeam = await Registration.find({ teamId: team.id }).select('id hackathonId').lean();
    const outsideRegs = allRegsForTeam.filter(r => !VERIFIED_QA_EVENT_IDS.includes(r.hackathonId));

    // Check all projects / submissions across the entire DB for this team
    const outsideProjects = await Project.find({ teamId: team.id, hackathonId: { $nin: VERIFIED_QA_EVENT_IDS } }).select('id hackathonId').lean();
    const outsideSubs = await Submission.find({ teamId: team.id, hackathonId: { $nin: VERIFIED_QA_EVENT_IDS } }).select('id hackathonId').lean();

    const isHistoricalAmbiguous = HISTORICAL_AMBIGUOUS_TEAMS.includes(team.id);
    const hasOutsideActivity = outsideRegs.length > 0 || outsideProjects.length > 0 || outsideSubs.length > 0;
    const isExplicitQaNamed = team.id.startsWith('t-qa-');

    if (isHistoricalAmbiguous) {
      teamAnalysis.push({
        teamId: team.id,
        name: team.name,
        isLocked: team.isLocked,
        currentIsTest: Boolean(team.isTest),
        classification: 'UNRESOLVED_AMBIGUOUS',
        action: 'LEAVE_UNCHANGED',
        reason: 'Historical squad with potential cross-event references and ambiguous ownership; excluded from automated mutation per safety protocol.'
      });
      unresolvedTeamIds.push(team.id);
    } else if (hasOutsideActivity) {
      teamAnalysis.push({
        teamId: team.id,
        name: team.name,
        isLocked: team.isLocked,
        currentIsTest: Boolean(team.isTest),
        classification: 'AMBIGUOUS_CROSS_EVENT',
        action: 'LEAVE_UNCHANGED',
        reason: `Team has registrations or projects linked to non-QA events (${outsideRegs.map(r => r.hackathonId).concat(outsideProjects.map(p => p.hackathonId)).join(', ')}). Excluded to protect legitimate activity.`
      });
      unresolvedTeamIds.push(team.id);
    } else if (isExplicitQaNamed) {
      teamAnalysis.push({
        teamId: team.id,
        name: team.name,
        isLocked: team.isLocked,
        currentIsTest: Boolean(team.isTest),
        classification: 'EXCLUSIVE_QA',
        action: 'CLASSIFY_TEST',
        reason: 'Explicitly prefixed t-qa-* squad with 100% exclusive activity within verified QA events.'
      });
      eligibleTeamIds.push(team.id);
    } else {
      teamAnalysis.push({
        teamId: team.id,
        name: team.name,
        isLocked: team.isLocked,
        currentIsTest: Boolean(team.isTest),
        classification: 'UNRESOLVED_NON_QA_PATTERN',
        action: 'LEAVE_UNCHANGED',
        reason: 'Team lacks explicit QA identifier prefix; left unchanged to prevent inadvertent exclusion.'
      });
      unresolvedTeamIds.push(team.id);
    }
  }

  const report = {
    mode: isApply ? 'APPLY' : 'DRY_RUN',
    timestamp: new Date().toISOString(),
    targetDatabase: activeDbName,
    targetClusterHost: activeHost,
    summary: {
      hackathonsFound: hackathons.length,
      registrationsFound: registrations.length,
      teamsEvaluated: teams.length,
      teamsEligibleForUpdate: eligibleTeamIds.length,
      teamsUnresolvedOrProtected: unresolvedTeamIds.length,
      alreadyClassifiedHackathons: hackathons.filter(h => h.isTest === true).length,
      alreadyClassifiedRegistrations: registrations.filter(r => r.isTest === true).length,
      alreadyClassifiedTeams: teams.filter(t => eligibleTeamIds.includes(t.id) && t.isTest === true).length
    },
    proposedUpdates: {
      events: hackathons.map(h => ({
        id: h.id,
        name: h.name,
        entryType: h.entryType,
        status: h.status,
        currentIsTest: Boolean(h.isTest),
        targetIsTest: true
      })),
      registrations: registrations.map(r => ({
        id: r.id,
        hackathonId: r.hackathonId,
        teamId: r.teamId || null,
        paymentStatus: r.paymentStatus,
        currentIsTest: Boolean(r.isTest),
        targetIsTest: true
      })),
      teams: teamAnalysis
    }
  };

  if (!isApply) {
    report.action = 'NONE_DRY_RUN';
    report.message = `DRY RUN completed. Zero records mutated. Pass --apply, --confirm-target=${activeDbName}, and --confirm-cluster=${activeHost} to execute updates.`;
  } else {
    // Execute idempotent updates
    const hackRes = await Hackathon.updateMany(
      { id: { $in: VERIFIED_QA_EVENT_IDS } },
      { $set: { isTest: true } }
    );
    const regRes = await Registration.updateMany(
      { hackathonId: { $in: VERIFIED_QA_EVENT_IDS } },
      { $set: { isTest: true } }
    );
    const teamRes = eligibleTeamIds.length > 0 ? await Team.updateMany(
      { id: { $in: eligibleTeamIds } },
      { $set: { isTest: true } }
    ) : { modifiedCount: 0 };

    report.action = 'APPLIED';
    report.mutations = {
      hackathonsModified: hackRes.modifiedCount,
      registrationsModified: regRes.modifiedCount,
      teamsModified: teamRes.modifiedCount
    };
    report.message = `APPLY completed. Target records updated to isTest: true. Unresolved teams (${unresolvedTeamIds.join(', ')}) strictly left unchanged.`;
  }

  if (!isConnected && !options.keepConnected) {
    await mongoose.disconnect();
  }

  return report;
}

// Direct CLI invocation
if (process.argv[1] && process.argv[1].endsWith('migrate-qa-data.mjs')) {
  runMigration()
    .then(report => {
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('[MIGRATION ERROR]', err.message);
      process.exit(1);
    });
}
