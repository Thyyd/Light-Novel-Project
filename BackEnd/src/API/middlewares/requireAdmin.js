import prisma from '../../db/client.js';

export async function requireAdmin(req, res, next) {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { firebaseUid: req.firebaseUser.uid },
    });

    if (!utilisateur) {
      return res.status(401).json({ error: { message: 'Utilisateur introuvable' } });
    }

    if (utilisateur.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Accès réservé aux administrateurs' } });
    }

    req.currentUser = utilisateur;
    return next();
  }
  catch (error) {
    return next(error);
  }
}