// Isolated actual HTTP acceptance; no production connection or external email.
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { setTestAppsScriptDispatcher } from './services/email.js';

test('paid registration actual HTTP acceptance', async () => {
 const mongo = await MongoMemoryServer.create();
 process.env.NODE_ENV = 'test'; process.env.MONGO_URI = mongo.getUri();
 process.env.MONGO_DB_NAME = 'isolated_paid_acceptance';
 process.env.ADMIN_NOTIFICATION_EMAIL = 'admin@example.test'; process.env.FRONTEND_URL = 'https://example.test';
 assert.match(process.env.MONGO_URI, /^mongodb:\/\/127\.0\.0\.1:/);
 const originalConnect = mongoose.connect.bind(mongoose);
 mongoose.connect = (uri, options) => { assert.equal(uri, mongo.getUri()); assert.equal(options.dbName, 'isolated_paid_acceptance'); return originalConnect(uri, options); };
 const mail = []; setTestAppsScriptDispatcher(async (template, to, data) => { mail.push({template,to,data}); return {success:true}; });
 let server;
 try {
  ({httpServer:server} = await import('./server.js')); await mongoose.connection.asPromise(); assert.equal(mongoose.connection.host, '127.0.0.1'); assert.equal(mongoose.connection.name, 'isolated_paid_acceptance');
  const {User, Registration, Team} = await import('./models/index.js'); await Registration.init();
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (path, token, body, expected=200, method=body===undefined?'GET':'POST') => {
   const response = await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
   const result=await response.json(); assert.equal(response.status,expected,`${path}: ${JSON.stringify(result)}`); return result;
  };
  const password = 'LocalAcceptance42!';
  await User.create({id:'local-admin',email:'local-admin@example.test',name:'Local admin',role:'admin',accountStatus:'active',emailVerified:true,passwordHash:await bcrypt.hash(password,10)});
  const admin=(await request('/auth/login',null,{email:'local-admin@example.test',password})).token;
  const students=[];
  for (const name of ['leader','member','outsider']) {
   const email=`${name}@example.test`;
   const pending=await request('/auth/register',null,{name,email,password,college:'Local QA',branch:'CS',year:'3'},201);
   await request('/auth/login',null,{email,password},401);
   const code=mail.findLast(m=>m.template==='verification_otp'&&m.to===email).data.code;
   await request('/auth/verify-email',null,{userId:pending.userId,code});
   students.push({id:pending.userId,token:(await request('/auth/login',null,{email,password})).token});
  }
  const [leader,member,outsider]=students;
  const event=await request('/hackathons',admin,{name:'ISOLATED paid acceptance',registrationStart:'2020-01-01',registrationEnd:'2099-01-01',entryType:'paid',fee:100,feeBasis:'per_participant',teamSizeMin:1,teamSizeMax:4});
  assert.equal(event.status,'draft');
  await request(`/hackathons/${event.id}/open-registration`,admin,{});
  // Current invite workflow requires the invitee to register before invitation.
  await request(`/hackathons/${event.id}/register`,member.token,{type:'solo'});
  const team=await request('/teams',leader.token,{name:'Isolated squad',hackathonId:event.id});
  const invite=await request(`/teams/${team.id}/invite`,leader.token,{receiverId:member.id});
  await request(`/teams/accept-invite/${invite.id}`,outsider.token,{},404);
  await request(`/teams/accept-invite/${invite.id}`,member.token,{});
  assert.deepEqual((await Team.findOne({id:team.id})).memberIds,[leader.id,member.id]);
  await request(`/teams/${team.id}/transfer`,member.token,{newLeaderId:member.id},403);
  await request(`/teams/${team.id}/transfer`,leader.token,{newLeaderId:outsider.id},400);
  await request('/teams/leave',leader.token,{},403);
  await request(`/teams/${team.id}/transfer`,leader.token,{newLeaderId:member.id});
  await request(`/teams/${team.id}/transfer`,member.token,{newLeaderId:leader.id});
  await request('/teams/leave',member.token,{});
  assert.equal((await User.findOne({id:member.id})).teamId,undefined);
  await request('/teams/join',member.token,{teamCode:team.id});
  await request(`/teams/${team.id}/kick`,member.token,{userId:leader.id},403);
  await request(`/teams/${team.id}/kick`,leader.token,{userId:member.id});
  assert.ok(!(await User.findOne({id:member.id})).teamId);
  await request('/teams/join',member.token,{teamCode:team.id});
  const {registration:reg}=await request(`/hackathons/${event.id}/register`,leader.token,{type:'team',teamId:team.id,feeAmount:1});
  assert.equal(reg.feeAmount,200); assert.equal(reg.rosterMembers.length,2);
  assert.equal((await Team.findOne({id:team.id})).isLocked,true);
  await request('/teams/leave',member.token,{},403);
  await request(`/teams/${team.id}/kick`,leader.token,{userId:member.id},403);
  await request(`/teams/${team.id}`,leader.token,undefined,403,'DELETE');
  await request(`/hackathons/${event.id}/register`,leader.token,{type:'team',teamId:team.id},409);
  // Real 1x1 PNG. A MIME label alone must never turn arbitrary bytes into a receipt.
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY9kAAAAASUVORK5CYII=','base64');
  assert.ok(png.length >= 32);
  const proof={transactionReference:'LOCAL-UTR-123456',paymentProofUrl:`data:image/png;base64,${png.toString('base64')}`};
  await request(`/hackathons/${event.id}/payment-proof`,leader.token,{...proof,paymentProofUrl:'data:image/png;base64,aGVsbG8='},400);
  assert.equal((await Registration.findOne({id:reg.id})).paymentStatus,'pending_proof');
  await request(`/hackathons/${event.id}/payment-proof`,leader.token,proof);
  await request(`/hackathons/${event.id}/payment-proof`,leader.token,proof,400);
  await request('/hackathons/'+event.id+'/register',outsider.token,{type:'solo'});
  await request('/hackathons/'+event.id+'/payment-proof',outsider.token,proof,409);
  const stored=await Registration.findOne({id:reg.id}); assert.equal(stored.paymentStatus,'payment_under_review');
  assert.equal(stored.storageProvider,'gridfs');
  assert.equal(stored.paymentProofUrl,`/api/student/registrations/${reg.id}/receipt/file`);
  assert.equal(stored.proofMimeType,'image/png'); assert.equal(stored.proofSizeBytes,png.length);
  const file=await mongoose.connection.db.collection('paymentProofs.files').findOne({_id:new mongoose.Types.ObjectId(stored.storagePath)});
  assert.equal(file.length,png.length);
  const queue=await request('/admin/payments',admin); assert.equal(queue.summary.pendingCount,1);
  await request(`/admin/payments/${reg.id}/receipt`,outsider.token,undefined,403);
  await request(`/admin/payments/${reg.id}/review`,outsider.token,{decision:'approve'},403);
  await request(`/admin/payments/${reg.id}/receipt`,null,undefined,401);
  assert.equal((await request(`/admin/payments/${reg.id}/receipt`,admin)).storageProvider,'gridfs');
  for (const token of [leader.token,member.token,admin]) {
   const response=await fetch(`${base}/student/registrations/${reg.id}/receipt/file`,{headers:{Authorization:`Bearer ${token}`}});
   assert.equal(response.status,200); assert.equal(response.headers.get('content-type'),'image/png');
   assert.match(response.headers.get('cache-control'),/private.*no-store/);
   assert.equal(response.headers.get('x-content-type-options'),'nosniff');
   assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);
  }
  const adminFile=await fetch(`${base}/admin/payments/${reg.id}/receipt/file`,{headers:{Authorization:`Bearer ${admin}`}});
  assert.equal(adminFile.status,200); assert.deepEqual(Buffer.from(await adminFile.arrayBuffer()),png);
  await request(`/student/registrations/${reg.id}/receipt/file`,outsider.token,undefined,403);
  await request(`/student/registrations/${reg.id}/receipt/file`,null,undefined,401);
  await request(`/admin/payments/${reg.id}/receipt/file`,outsider.token,undefined,403);
  await request(`/admin/payments/${reg.id}/receipt/file`,null,undefined,401);
  await request(`/admin/payments/${reg.id}/review`,admin,{decision:'reject',reason:'Isolated test rejection'});
  await request(`/hackathons/${event.id}/retry-payment`,leader.token,{});
  await request(`/hackathons/${event.id}/payment-proof`,leader.token,{...proof,transactionReference:'LOCAL-UTR-654321'});
  await request(`/admin/payments/${reg.id}/review`,admin,{decision:'approve'});
  const approved=await Registration.findOne({id:reg.id}); assert.equal(approved.status,'registered'); assert.equal(approved.reviewHistory.length,4);
  // Review intentionally supports re-audit; duplicate proof submission is the guarded action.
  await request(`/admin/payments/${reg.id}/review`,admin,{decision:'reject',reason:'Verified-payment re-audit'});
  assert.equal((await Registration.findOne({id:reg.id})).paymentStatus,'rejected');
  await request(`/admin/payments/${reg.id}/review`,admin,{decision:'approve',reason:'Rejected-payment re-audit'});
  await request(`/admin/payments/${reg.id}/review`,admin,{noteOnly:true,reason:'Isolated audit note'});
  const reaudited=await Registration.findOne({id:reg.id}); assert.equal(reaudited.status,'registered'); assert.equal(reaudited.reviewHistory.length,7);
  assert.equal(reaudited.reviewHistory.at(-1).status,'note_updated');
  await request(`/hackathons/${event.id}/retry-payment`,leader.token,{},404);
  assert.equal(mail.filter(m=>m.template==='payment_review_notification').length,2);
  const disposableTeam=await request('/teams',outsider.token,{name:'QA-2026-11-02-DISBAND'});
  await request(`/teams/${disposableTeam.id}`,member.token,undefined,403,'DELETE');
  await request(`/teams/${disposableTeam.id}`,outsider.token,undefined,200,'DELETE');
  assert.equal(await Team.countDocuments({id:disposableTeam.id}),0);
  assert.ok(!(await User.findOne({id:outsider.id})).teamId);
  const free=await request('/hackathons',admin,{name:'QA-2026-11-02-FREE',registrationStart:'2020-01-01',registrationEnd:'2099-01-01',entryType:'free',fee:0,teamSizeMin:1,teamSizeMax:4});
  await request(`/hackathons/${free.id}/open-registration`,admin,{});
  const freeReg=await request(`/hackathons/${free.id}/register`,outsider.token,{type:'solo'});
  assert.equal(freeReg.registration.feeAmount,0); assert.equal(freeReg.registration.status,'registered');
 } finally {
  setTestAppsScriptDispatcher(null); if(server?.listening) await new Promise(resolve=>server.close(resolve));
  await mongoose.disconnect(); await mongo.stop();
 }
});



