import request from 'supertest';
import prisma from '../../src/db/client.js';
import app from '../../src/app.js';

jest.mock('../../src/config/firebase.js', () => ({
  firebaseAuth: {
    verifyIdToken: jest.fn(),
    deleteUser: jest.fn(),
  },
}));

beforeAll(async () => {
  await prisma.utilisateur.create({
    data: {
      firebaseUid: 'lookup-test-uid',
      email: 'lookup@example.com',
      pseudo: 'LookupUser',
      avatarUrl: 'https://example.com/avatar.png',
    },
  });
});

afterAll(async () => {
  await prisma.utilisateur.deleteMany({ where: { pseudo: 'LookupUser' } });
  await prisma.$disconnect();
});


describe('GET /api/users/email', () => {
  it('Renvoie 200 avec id, pseudo et email pour un pseudo existant', async () => {
    const response = await request(app)
      .get('/api/users/email')
      .query({ pseudo: 'LookupUser' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      pseudo: 'LookupUser',
      email: 'lookup@example.com',
    });
    expect(response.body.data.id).toBeDefined();
  });

  it('Renvoie 404 générique pour un pseudo inconnu', async () => {
    const response = await request(app)
      .get('/api/users/email')
      .query({ pseudo: 'PseudoInconnu' });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Identifiants invalides');
  });

  it('Renvoie 400 si le pseudo ne respecte pas le schéma de validation', async () => {
    const response = await request(app)
      .get('/api/users/email')
      .query({ pseudo: 'ab' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Données invalides');
    expect(response.body.error.details).toContain('Le pseudo doit contenir au moins 3 caractères');
  });
});