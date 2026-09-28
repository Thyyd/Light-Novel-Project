import request from 'supertest';
import prisma from '../../src/db/client.js';
import app from '../../src/app.js';

jest.mock('../../src/config/firebase.js', () => ({
  firebaseAuth: {
    verifyIdToken: jest.fn(),
  },
}));

let editeur;
let genre;
let theme;
let auteur;
let illustrateur;
let user1;
let user2;

let serieAvecPlusieursVolumes;
let serieAvecUnSeulVolume;
let volumePrincipal;
let volumeUnique;

beforeAll(async () => {
  editeur = await prisma.editeur.create({ data: { nom: 'Éditeur Test Volumes' } });
  genre = await prisma.genre.create({ data: { nom: 'Fantasy Test Volumes' } });
  theme = await prisma.theme.create({ data: { nom: 'Voyage Test Volumes' } });
  auteur = await prisma.auteur.create({ data: { nom: 'Hasekura', prenom: 'Isuna' } });
  illustrateur = await prisma.illustrateur.create({ data: { nom: 'Ayakura', prenom: 'Juu' } });

  user1 = await prisma.utilisateur.create({
    data: { firebaseUid: 'vol-user-1', email: 'voluser1@test.com', pseudo: 'VolUser1', avatarUrl: 'https://example.com/avatar1.png' },
  });
  user2 = await prisma.utilisateur.create({
    data: { firebaseUid: 'vol-user-2', email: 'voluser2@test.com', pseudo: 'VolUser2', avatarUrl: 'https://example.com/avatar2.png' },
  });

  // Série avec plusieurs volumes, genre/thème/auteur/illustrateur associés
  serieAvecPlusieursVolumes = await prisma.serie.create({
    data: {
      titre: 'Spice and Wolf',
      synopsis: 'Synopsis de test.',
      statut: 'en_cours',
      couvertureUrl: 'https://example.com/cover-test.jpg',
      editeurId: editeur.id,
    },
  });

  await prisma.serieGenre.create({ data: { serieId: serieAvecPlusieursVolumes.id, genreId: genre.id } });
  await prisma.serieTheme.create({ data: { serieId: serieAvecPlusieursVolumes.id, themeId: theme.id } });
  await prisma.serieAuteur.create({ data: { serieId: serieAvecPlusieursVolumes.id, auteurId: auteur.id } });
  await prisma.serieIllustrateur.create({ data: { serieId: serieAvecPlusieursVolumes.id, illustrateurId: illustrateur.id } });

  volumePrincipal = await prisma.volume.create({
    data: {
      serieId: serieAvecPlusieursVolumes.id,
      numeroVolume: 2,
      titre: 'Spice and Wolf Tome 2',
      synopsis: 'Synopsis du tome 2.',
      nbPages: 240,
      couvertureUrl: 'https://example.com/spice-wolf-2.jpg',
    },
  });

  await prisma.volume.create({
    data: {
      serieId: serieAvecPlusieursVolumes.id,
      numeroVolume: 1,
      titre: 'Spice and Wolf Tome 1',
      synopsis: 'Synopsis du tome 1.',
      nbPages: 220,
      couvertureUrl: 'https://example.com/spice-wolf-1.jpg',
    },
  });

  await prisma.volume.create({
    data: {
      serieId: serieAvecPlusieursVolumes.id,
      numeroVolume: 3,
      titre: 'Spice and Wolf Tome 3',
      synopsis: 'Synopsis du tome 3.',
      nbPages: 250,
      couvertureUrl: 'https://example.com/spice-wolf-3.jpg',
    },
  });

  // Série avec un seul volume, pour tester autresVolumes: []
  serieAvecUnSeulVolume = await prisma.serie.create({
    data: {
      titre: 'No Game No Life',
      synopsis: 'Synopsis de test.',
      statut: 'en_cours',
      couvertureUrl: 'https://example.com/cover-test-2.jpg',
      editeurId: editeur.id,
    },
  });

  volumeUnique = await prisma.volume.create({
    data: {
      serieId: serieAvecUnSeulVolume.id,
      numeroVolume: 1,
      titre: 'No Game No Life Tome 1',
      synopsis: 'Synopsis de test.',
      nbPages: 200,
      couvertureUrl: 'https://example.com/ngnl-1.jpg',
    },
  });

  // Notes : 2 notes sur volumePrincipal (moyenne attendue 3+4 / 2 = 3.5), 1 note "série" à ne pas compter
  await prisma.note.create({
    data: { userId: user1.id, serieId: serieAvecPlusieursVolumes.id, volumeId: volumePrincipal.id, note: 3 },
  });
  await prisma.note.create({
    data: { userId: user2.id, serieId: serieAvecPlusieursVolumes.id, volumeId: volumePrincipal.id, note: 4 },
  });
  await prisma.note.create({
    data: { userId: user1.id, serieId: serieAvecPlusieursVolumes.id, volumeId: null, note: 5 },
  });

  // Commentaires : 12 sur volumePrincipal (pagination), 1 sur la série (volumeId null, à exclure)
  const commentairesVolume = Array.from({ length: 12 }, (_, i) => ({
    userId: i % 2 === 0 ? user1.id : user2.id,
    serieId: serieAvecPlusieursVolumes.id,
    volumeId: volumePrincipal.id,
    contenu: `Commentaire volume numéro ${i + 1}.`,
  }));
  await prisma.commentaire.createMany({ data: commentairesVolume });

  await prisma.commentaire.create({
    data: {
      userId: user2.id,
      serieId: serieAvecPlusieursVolumes.id,
      volumeId: null,
      contenu: 'Commentaire sur la série, ne doit pas apparaître sur le volume.',
    },
  });
});

afterAll(async () => {
  await prisma.serie.deleteMany({
    where: { id: { in: [serieAvecPlusieursVolumes.id, serieAvecUnSeulVolume.id] } },
  });
  await prisma.utilisateur.deleteMany({ where: { firebaseUid: { in: ['vol-user-1', 'vol-user-2'] } } });
  await prisma.genre.deleteMany({ where: { id: genre.id } });
  await prisma.theme.deleteMany({ where: { id: theme.id } });
  await prisma.auteur.deleteMany({ where: { id: auteur.id } });
  await prisma.illustrateur.deleteMany({ where: { id: illustrateur.id } });
  await prisma.editeur.deleteMany({ where: { id: editeur.id } });
  await prisma.$disconnect();
});

describe('GET /api/volumes/:id', () => {
  it('Renvoie 200 avec tous les champs attendus pour un volume existant', async () => {
    const response = await request(app).get(`/api/volumes/${volumePrincipal.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: volumePrincipal.id,
      titre: 'Spice and Wolf Tome 2',
      nbPages: 240,
    });
    expect(response.body.data).toHaveProperty('synopsis');
    expect(response.body.data).toHaveProperty('couvertureUrl');
  });

  it("Renvoie serie limité à l'id et au titre", async () => {
    const response = await request(app).get(`/api/volumes/${volumePrincipal.id}`);

    expect(response.body.data.serie).toEqual({
      id: serieAvecPlusieursVolumes.id,
      titre: 'Spice and Wolf',
    });
  });

  it('Renvoie les genres, thèmes, auteurs et illustrateurs hérités de la série', async () => {
    const response = await request(app).get(`/api/volumes/${volumePrincipal.id}`);

    expect(response.body.data.genres).toContain('Fantasy Test Volumes');
    expect(response.body.data.themes).toContain('Voyage Test Volumes');
    expect(response.body.data.auteurs).toEqual(['Hasekura Isuna']);
    expect(response.body.data.illustrateurs).toEqual(['Ayakura Juu']);
  });

  it('Renvoie les autres volumes triés, en excluant le volume courant', async () => {
    const response = await request(app).get(`/api/volumes/${volumePrincipal.id}`);

    expect(response.body.data.autresVolumes).toHaveLength(2);
    expect(response.body.data.autresVolumes.map((v) => v.numeroVolume)).toEqual(['1', '3']);
    expect(response.body.data.autresVolumes.some((v) => v.id === volumePrincipal.id)).toBe(false);
  });

  it('Renvoie un tableau vide pour autresVolumes quand la série n\'a qu\'un seul volume', async () => {
    const response = await request(app).get(`/api/volumes/${volumeUnique.id}`);

    expect(response.body.data.autresVolumes).toEqual([]);
  });

  it('Calcule la moyenne des notes propres au volume, en excluant les notes "série"', async () => {
    const response = await request(app).get(`/api/volumes/${volumePrincipal.id}`);

    expect(response.body.data.noteMoyenne).toBe(3.5);
  });

  it('Renvoie noteMoyenne: null pour un volume sans note', async () => {
    const response = await request(app).get(`/api/volumes/${volumeUnique.id}`);

    expect(response.body.data.noteMoyenne).toBeNull();
  });

  it('Pagine les commentaires avec la limite par défaut (10)', async () => {
    const response = await request(app).get(`/api/volumes/${volumePrincipal.id}`);

    expect(response.body.data.commentaires.data).toHaveLength(10);
    expect(response.body.data.commentaires.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 12,
      totalPages: 2,
    });
  });

  it('Renvoie la seconde page de commentaires avec commentPage=2', async () => {
    const response = await request(app).get(`/api/volumes/${volumePrincipal.id}?commentPage=2`);

    expect(response.body.data.commentaires.data).toHaveLength(2);
    expect(response.body.data.commentaires.pagination.page).toBe(2);
  });

  it('Trie les commentaires du plus ancien au plus récent', async () => {
    const response = await request(app).get(`/api/volumes/${volumePrincipal.id}`);

    expect(response.body.data.commentaires.data[0].contenu).toBe('Commentaire volume numéro 1.');
  });

  it('Exclut les commentaires attachés à la série (volumeId null) des commentaires du volume', async () => {
    const response = await request(app).get(`/api/volumes/${volumePrincipal.id}`);

    const contenus = response.body.data.commentaires.data.map((c) => c.contenu);
    expect(contenus).not.toContain('Commentaire sur la série, ne doit pas apparaître sur le volume.');
  });

  it('Renvoie 400 si commentLimit dépasse 20', async () => {
    const response = await request(app).get(`/api/volumes/${volumePrincipal.id}?commentLimit=100`);

    expect(response.status).toBe(400);
    expect(response.body.error.details).toContain('commentLimit ne peut pas dépasser 20');
  });

  it('Renvoie 400 si id est non numérique', async () => {
    const response = await request(app).get('/api/volumes/abc');

    expect(response.status).toBe(400);
    expect(response.body.error.details).toContain('id doit être un entier');
  });

  it('Renvoie 404 si le volume est introuvable', async () => {
    const response = await request(app).get('/api/volumes/999999');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Volume introuvable');
  });
});
