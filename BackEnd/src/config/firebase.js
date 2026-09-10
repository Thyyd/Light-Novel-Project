import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env.js';

const firebaseApp = initializeApp({
  credential: cert({
    projectId: env.firebase.projectId,
    clientEmail: env.firebase.clientEmail,
    privateKey: env.firebase.privateKey.replace(/\\n/g, '\n'),
  }),
});

export const firebaseAuth = getAuth(firebaseApp);
