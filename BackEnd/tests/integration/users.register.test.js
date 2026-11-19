import request from 'supertest';
import prisma from '../../src/db/client.js';
import app from '../../src/app.js';
import { firebaseAuth } from '../../src/config/firebase.js';

jest.mock('../../src/config/firebase.js', () => ({
  firebaseAuth: {
    verifyIdToken: jest.fn(),
    deleteUser: jest.fn(),
  },
}));

afterEach(async () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  await prisma.utilisateur.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});


describe('POST /api/users', () => {
  it('Crée un utilisateur avec un token valide et un pseudo valide', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'fake-firebase-uid',
      email: 'test@example.com',
    });

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer fake-token')
      .send({ pseudo: 'TestUser' });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      firebaseUid: 'fake-firebase-uid',
      email: 'test@example.com',
      pseudo: 'TestUser',
      role: 'user',
    });
    expect(response.body.data.avatarUrl).toBeTruthy();

    const utilisateurEnBase = await prisma.utilisateur.findUnique({
      where: { firebaseUid: 'fake-firebase-uid' },
    });
    expect(utilisateurEnBase).not.toBeNull();
  });

  it('Renvoie 409 et supprime le compte Firebase si le pseudo est déjà utilisé', async () => {
    await prisma.utilisateur.create({
      data: {
        firebaseUid: 'existing-uid',
        email: 'existing@example.com',
        pseudo: 'TestUser',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });

    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'new-uid',
      email: 'new@example.com',
    });
    firebaseAuth.deleteUser.mockResolvedValueOnce();

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer fake-token')
      .send({ pseudo: 'TestUser' });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('Ce pseudo est déjà utilisé');

    expect(firebaseAuth.deleteUser).toHaveBeenCalledWith('new-uid');

    const utilisateurEnBase = await prisma.utilisateur.findUnique({
      where: { firebaseUid: 'new-uid' },
    });
    expect(utilisateurEnBase).toBeNull();
  });

  it('renvoie 400 si le pseudo ne respecte pas le schéma de validation', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'fake-firebase-uid',
      email: 'test@example.com',
    });

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer fake-token')
      .send({ pseudo: 'ab' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Données invalides');
    expect(response.body.error.details).toContain('Le pseudo doit contenir au moins 3 caractères');

    const utilisateurEnBase = await prisma.utilisateur.findUnique({
      where: { firebaseUid: 'fake-firebase-uid' },
    });
    expect(utilisateurEnBase).toBeNull();
  });

  it('renvoie 401 si le header Authorization est manquant', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ pseudo: 'TestUser' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token manquant ou mal formé');

    expect(firebaseAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  it('Renvoie 409 et supprime le compte Firebase si le pseudo est déjà utilisé (casse différente)', async () => {
    await prisma.utilisateur.create({
      data: {
        firebaseUid: 'existing-uid',
        email: 'existing@example.com',
        pseudo: 'TestUser',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });

    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'new-uid',
      email: 'new@example.com',
    });
    firebaseAuth.deleteUser.mockResolvedValueOnce();

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer fake-token')
      .send({ pseudo: 'testuser' });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('Ce pseudo est déjà utilisé');

    expect(firebaseAuth.deleteUser).toHaveBeenCalledWith('new-uid');

    const utilisateurEnBase = await prisma.utilisateur.findUnique({
      where: { firebaseUid: 'new-uid' },
    });
    expect(utilisateurEnBase).toBeNull();
  });

  it('Renvoie 409 si le pseudo est déjà utilisé (casse différente, avec accent)', async () => {
    await prisma.utilisateur.create({
      data: {
        firebaseUid: 'existing-uid',
        email: 'existing@example.com',
        pseudo: 'Élodie',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });

    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'new-uid',
      email: 'new@example.com',
    });
    firebaseAuth.deleteUser.mockResolvedValueOnce();

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer fake-token')
      .send({ pseudo: 'élodie' });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('Ce pseudo est déjà utilisé');
    expect(firebaseAuth.deleteUser).toHaveBeenCalledWith('new-uid');
  });

  it("Crée un utilisateur et stocke l'apostrophe typographique en apostrophe droite", async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'fake-firebase-uid',
      email: 'test@example.com',
    });

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer fake-token')
      .send({ pseudo: 'L\u2019as' }); // \u2019 → ’

    expect(response.status).toBe(201);
    expect(response.body.data.pseudo).toBe("L'as");

    const utilisateurEnBase = await prisma.utilisateur.findUnique({
      where: { firebaseUid: 'fake-firebase-uid' },
    });
    expect(utilisateurEnBase.pseudo).toBe("L'as");
  });

  it("Renvoie 409 si le pseudo ne diffère que par l'apostrophe (’ vs ')", async () => {
    await prisma.utilisateur.create({
      data: {
        firebaseUid: 'existing-uid',
        email: 'existing@example.com',
        pseudo: "L'as",
        avatarUrl: 'https://example.com/avatar.png',
      },
    });

    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'new-uid',
      email: 'new@example.com',
    });
    firebaseAuth.deleteUser.mockResolvedValueOnce();

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer fake-token')
      .send({ pseudo: 'L\u2019as' }); // \u2019 → ’

    expect(response.status).toBe(409);
    expect(firebaseAuth.deleteUser).toHaveBeenCalledWith('new-uid');
  });

  it("Ignore le rôle transmis par le client et crée l'utilisateur avec le rôle 'user'", async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'fake-firebase-uid',
      email: 'test@example.com',
    });

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer fake-token')
      .send({ pseudo: 'TestUser', role: 'admin' });

    expect(response.status).toBe(201);
    expect(response.body.data.role).toBe('user');

    const utilisateurEnBase = await prisma.utilisateur.findUnique({
      where: { firebaseUid: 'fake-firebase-uid' },
    });
    expect(utilisateurEnBase.role).toBe('user');
  });

  it('renvoie 401 si le token est invalide ou expiré', async () => {
    firebaseAuth.verifyIdToken.mockRejectedValueOnce(new Error('invalid token'));

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer bad-token')
      .send({ pseudo: 'TestUser' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token invalide ou expiré');
    expect(firebaseAuth.verifyIdToken).toHaveBeenCalledWith('bad-token');

    expect(await prisma.utilisateur.count()).toBe(0);
  });

  it('Renvoie 409 même si la suppression du compte Firebase échoue (rollback seulement journalisé)', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await prisma.utilisateur.create({
      data: {
        firebaseUid: 'existing-uid',
        email: 'existing@example.com',
        pseudo: 'TestUser',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });

    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'new-uid',
      email: 'new@example.com',
    });
    firebaseAuth.deleteUser.mockRejectedValueOnce(new Error('échec'));

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer fake-token')
      .send({ pseudo: 'TestUser' });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('Ce pseudo est déjà utilisé');
    expect(firebaseAuth.deleteUser).toHaveBeenCalledWith('new-uid');
    expect(consoleErrorSpy).toHaveBeenCalled();

    const utilisateurEnBase = await prisma.utilisateur.findUnique({
      where: { firebaseUid: 'new-uid' },
    });
    expect(utilisateurEnBase).toBeNull();
  });
});