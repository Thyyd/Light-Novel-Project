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

let utilisateur;

beforeAll(async () => {
  utilisateur = await prisma.utilisateur.create({
    data: {
      firebaseUid: 'me-fake-uid',
      email: 'me@example.com',
      pseudo: 'MeUser',
      avatarUrl: 'https://example.com/avatar.png',
    },
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await prisma.utilisateur.deleteMany();
  await prisma.$disconnect();
});

describe('GET /api/users/me', () => {
  it('Renvoie les données de l’utilisateur connecté avec un token valide', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'me-fake-uid',
    });

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: utilisateur.id,
      pseudo: 'MeUser',
      avatarUrl: 'https://example.com/avatar.png',
      role: 'user',
      email: 'me@example.com',
    });
    expect(response.body.data.createdAt).toBeTruthy();
    expect(response.body.data.firebaseUid).toBeUndefined();
  });

  it('Renvoie 401 si le header Authorization est manquant', async () => {
    const response = await request(app).get('/api/users/me');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token manquant ou mal formé');

    expect(firebaseAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  it('Renvoie 401 si le token est invalide ou expiré', async () => {
    firebaseAuth.verifyIdToken.mockRejectedValueOnce(new Error('invalid token'));

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer bad-token');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token invalide ou expiré');
  });

  it('Renvoie 404 si aucun utilisateur ne correspond au token', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'unknown-uid',
    });

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Utilisateur non inscrit sur LightNoverse');
  });
});