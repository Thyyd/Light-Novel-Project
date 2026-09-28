import { firebaseAuth } from '../../config/firebase.js';

export async function decodeToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Token manquant ou mal formé' } });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);

    req.firebaseUser = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  }
  catch (error) {
    return res.status(401).json({ error: { message: 'Token invalide ou expiré' } });
  }
}