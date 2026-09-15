import prisma from '../../db/client.js';
import { firebaseAuth } from '../../config/firebase.js';
import { registerBodySchema } from '../validators/users.validator.js';
import { env } from '../../config/env.js';

export async function registerUser(req, res, next) {
  const parseResult = registerBodySchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: {
        message: 'Données invalides',
        details: parseResult.error.issues.map((issue) => issue.message),
      },
    });
  }

  const { pseudo } = parseResult.data;

  try {
    const utilisateur = await prisma.utilisateur.create({
      data: {
        firebaseUid: req.firebaseUser.uid,
        email: req.firebaseUser.email,
        pseudo,
        avatarUrl: env.cloudinary.defaultAvatarUrl,
      },
    });

    return res.status(201).json({ data: utilisateur });
  }
  catch (error) {
    try {
      await firebaseAuth.deleteUser(req.firebaseUser.uid);
    }
    catch (rollbackError) {
      console.error('Échec du rollback Firebase pour uid', req.firebaseUser.uid, rollbackError);
    }

    if (error.code === 'P2002') {
      return res.status(409).json({ error: { message: 'Ce pseudo est déjà utilisé' } });
    }

    return next(error);
  }
}
