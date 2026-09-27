import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const uid = process.argv[2];
const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
if (!uid || !projectId) throw new Error('Usage: node scripts/grantAdmin.mjs <firebase-auth-uid> (with GCLOUD_PROJECT set)');
initializeApp({ credential: applicationDefault(), projectId });
const user = await getAuth().getUser(uid);
const email = user.email?.toLowerCase();
const allowed = ['vinayakcollection9355@gmail.com', 'vcmartshop@gmail.com'];
if (!email || !allowed.includes(email)) throw new Error('Admin grant refused: account email is not on the VC MART owner allow-list.');
const db = getFirestore();
const now = new Date().toISOString();
await db.doc(`adminUsers/${uid}`).set({ uid, email, active: true, createdAt: now, updatedAt: now });
console.log(`Granted admin access to ${email} (${uid}).`);
