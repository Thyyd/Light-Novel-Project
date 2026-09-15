import { firebaseAuth } from '../../config/firebase.js';
import prisma from '../../db/client.js';

export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Token manquant ou mal formé' } });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!utilisateur) {
      return res.status(404).json({ error: { message: 'Utilisateur non inscrit sur LightVerse' } });
    }

    req.user = utilisateur;
    next();
  }
  catch (error) {
    return res.status(401).json({ error: { message: 'Token invalide ou expiré' } });
  }
}
