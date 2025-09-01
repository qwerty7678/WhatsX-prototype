import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { initializeApp as initializeFirebaseAdmin, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import twilio from 'twilio';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  initializeFirebaseAdmin({
    credential: admin.credential.applicationDefault() || applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();
const adminAuth = getAdminAuth();

// Twilio client (lazy, might not be used in prototype)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Middleware: Verify Firebase ID token and attach user
async function verifyFirebaseToken(req, res, next) {
  if (process.env.DEMO_MODE === 'true') {
    const role = (req.headers['x-demo-user'] || 'user').toString() === 'admin' ? 'admin' : 'user';
    req.user = { uid: role === 'admin' ? 'demo-admin' : 'demo-user', admin: role === 'admin' };
    return next();
  }
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    req.user = decoded; // includes uid and custom claims
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware: Require admin custom claim
function requireAdmin(req, res, next) {
  if (req.user?.admin === true) return next();
  return res.status(403).json({ error: 'Admin only' });
}

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Templates CRUD: read allowed for any authenticated user; write restricted to admins
app.get('/api/templates', verifyFirebaseToken, async (_req, res) => {
  try {
    const snap = await db.collection('templates').get();
    const templates = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(templates);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

app.post('/api/templates', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { name, body, variables } = req.body;
    const docRef = await db.collection('templates').add({
      userId: req.user.uid,
      name,
      body,
      variables: Array.isArray(variables) ? variables : [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const saved = await docRef.get();
    res.status(201).json({ id: saved.id, ...saved.data() });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

app.put('/api/templates/:id', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, body, variables } = req.body;
    const ref = db.collection('templates').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    await ref.update({
      name,
      body,
      variables: Array.isArray(variables) ? variables : [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const updated = await ref.get();
    res.json({ id, ...updated.data() });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

app.delete('/api/templates/:id', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection('templates').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    await ref.delete();
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Admin: Manage users via Firebase Admin SDK
app.get('/api/admin/users', verifyFirebaseToken, requireAdmin, async (_req, res) => {
  try {
    if (process.env.DEMO_MODE === 'true') {
      const snap = await db.collection('users').get();
      const users = snap.docs.map((d) => d.data());
      return res.json(users);
    }
    const list = await adminAuth.listUsers(1000);
    res.json(list.users.map((u) => ({ uid: u.uid, email: u.email, displayName: u.displayName, disabled: u.disabled })));
  } catch (e) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

app.post('/api/admin/users', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, displayName, admin: makeAdmin } = req.body;
    if (process.env.DEMO_MODE === 'true') {
      const uid = `demo-${Date.now()}`;
      const role = makeAdmin ? 'admin' : 'user';
      await db.collection('users').doc(uid).set({
        uid,
        email,
        displayName: displayName || '',
        role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(201).json({ uid, email, displayName });
    }
    const user = await adminAuth.createUser({ email, password, displayName });
    if (makeAdmin) {
      await adminAuth.setCustomUserClaims(user.uid, { admin: true });
    }
    const role = makeAdmin ? 'admin' : 'user';
    await db.collection('users').doc(user.uid).set({ uid: user.uid, email: user.email, displayName: user.displayName || '', role, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.status(201).json({ uid: user.uid, email: user.email, displayName: user.displayName });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/admin/users/:uid', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { email, password, displayName, admin: setAdmin } = req.body;
    if (process.env.DEMO_MODE === 'true') {
      const userDoc = db.collection('users').doc(uid);
      await userDoc.set({ uid, email, displayName: displayName || '', role: setAdmin ? 'admin' : 'user', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return res.json({ uid, email, displayName });
    }
    const user = await adminAuth.updateUser(uid, { email, password, displayName });
    if (typeof setAdmin === 'boolean') {
      await adminAuth.setCustomUserClaims(uid, { admin: setAdmin });
    }
    const userDoc = db.collection('users').doc(uid);
    await userDoc.set({ uid, email: user.email, displayName: user.displayName || '', role: setAdmin ? 'admin' : 'user', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    res.json({ uid: user.uid, email: user.email, displayName: user.displayName });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:uid', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    if (process.env.DEMO_MODE === 'true') {
      await db.collection('users').doc(uid).delete();
      return res.status(204).end();
    }
    await adminAuth.deleteUser(uid);
    await db.collection('users').doc(uid).delete();
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Optional Twilio send endpoint (prototype)
app.post('/api/send-message', verifyFirebaseToken, async (req, res) => {
  try {
    const { toNumbers, messageText } = req.body;
    const inputNumbers = (toNumbers || []).map(String);
    const uniqueNumbers = Array.from(new Set(inputNumbers));
    const duplicatesRemoved = Math.max(0, inputNumbers.length - uniqueNumbers.length);
    const payload = {
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      body: messageText,
    };
    console.log('Message would be sent to:', uniqueNumbers);
    if (duplicatesRemoved > 0) {
      console.log(`Duplicates removed: ${duplicatesRemoved}`);
    }
    // Prototype: do not actually send unless env ALLOW_SEND === 'true'
    if (process.env.ALLOW_SEND === 'true' && twilioClient) {
      const responses = await Promise.all(uniqueNumbers.map((num) => twilioClient.messages.create({ ...payload, to: `whatsapp:${num}` })));
      return res.json({ sent: responses.length, uniqueNumbers, duplicatesRemoved, responses: responses.map((r) => ({ sid: r.sid })) });
    }
    // Simulate
    return res.json({ sent: 0, uniqueNumbers, duplicatesRemoved, simulated: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to process message request' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});

