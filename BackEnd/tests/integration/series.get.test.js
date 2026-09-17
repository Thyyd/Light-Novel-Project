import request from 'supertest';
import prisma from '../../src/db/client.js';
import app from '../../src/app.js';

jest.mock('../../src/config/firebase.js', () => ({
  firebaseAuth: {
    verifyIdToken: jest.fn(),
  },
}));

let editeur;
let genreFantasy;
let genreIsekai;
let themeVengeance;
let auteur;
let series;

const TITRES_LN = [
  '86',
  'Bakemonogatari',
  'Classroom of the Elite',
  'Goblin Slayer',
  'Konosuba : Sois béni monde merveilleux !',
  'Log Horizon',
  'Mushoku Tensei : Nouvelle vie, nouvelle chance',
  'No Game No Life',
  'Overlord',
  'Re:Zero : Re:Vivre dans un autre monde à partir de zéro',
  'Spice and Wolf',
  'Sword Art Online',
  'That Time I Got Reincarnated as a Slime',
  'The Rising of the Shield Hero',
  'The Saga of Tanya the Evil',
];

let user1;
let user2;

beforeAll(async () => {
  editeur = await prisma.editeur.create({ data: { nom: 'Éditeur Test GET' } });

  genreFantasy = await prisma.genre.create({ data: { nom: 'Fantasy Test' } });
  genreIsekai = await prisma.genre.create({ data: { nom: 'Isekai Test' } });
  themeVengeance = await prisma.theme.create({ data: { nom: 'Vengeance Test' } });

  auteur = await prisma.auteur.create({ data: { nom: 'Kumo', prenom: 'Kagyu' } });

  series = {};

  for (const titre of TITRES_LN) {
    series[titre] = await prisma.serie.create({
      data: {
        titre,
        synopsis: `Synopsis de test pour ${titre}.`,
        statut: 'en_cours',
        couvertureUrl: 'https://example.com/cover-test.jpg',
        editeurId: editeur.id,
      },
    });
  }

  // "86" reste volontairement sans genre, pour tester le cas genres: []
  const titresAvecGenres = TITRES_LN.filter((titre) => titre !== '86');
  for (const titre of titresAvecGenres) {
    await prisma.serieGenre.create({
      data: { serieId: series[titre].id, genreId: genreFantasy.id },
    });
  }
  await prisma.serieGenre.create({
    data: { serieId: series['Log Horizon'].id, genreId: genreIsekai.id },
  });

  // Thème sur Tanya + Goblin Slayer, pour tester la séparation genres/thèmes
  await prisma.serieTheme.create({
    data: { serieId: series['The Saga of Tanya the Evil'].id, themeId: themeVengeance.id },
  });
  await prisma.serieTheme.create({
    data: { serieId: series['Goblin Slayer'].id, themeId: themeVengeance.id },
  });

  // Un seul auteur associé, sur Goblin Slayer (les autres restent sans auteur)
  await prisma.serieAuteur.create({
    data: { serieId: series['Goblin Slayer'].id, auteurId: auteur.id },
  });

  // 4 titres alternatifs (un par type) sur Tanya, pour vérifier le filtrage anglais/romaji
  await prisma.titreAlternatif.createMany({
    data: [
      { serieId: series['The Saga of Tanya the Evil'].id, titre: 'The Saga of Tanya the Evil', type: 'anglais' },
      { serieId: series['The Saga of Tanya the Evil'].id, titre: 'Youjo Senki', type: 'romaji' },
      { serieId: series['The Saga of Tanya the Evil'].id, titre: 'Tanya', type: 'diminutif' },
      { serieId: series['The Saga of Tanya the Evil'].id, titre: 'Saga de Tanya', type: 'autre' },
    ],
  });

  user1 = await prisma.utilisateur.create({
    data: { firebaseUid: 'get-user-1', email: 'user1@test.com', pseudo: 'User1Test', avatarUrl: 'https://example.com/avatar1.png' },
  });
  user2 = await prisma.utilisateur.create({
    data: { firebaseUid: 'get-user-2', email: 'user2@test.com', pseudo: 'User2Test', avatarUrl: 'https://example.com/avatar2.png' },
  });

  // Mushoku Tensei : 2 notes "série" (volumeId null) → moyenne attendue (4+5)/2 = 4.5
  await prisma.note.create({
    data: { userId: user1.id, serieId: series['Mushoku Tensei : Nouvelle vie, nouvelle chance'].id, volumeId: null, note: 4 },
  });
  await prisma.note.create({
    data: { userId: user2.id, serieId: series['Mushoku Tensei : Nouvelle vie, nouvelle chance'].id, volumeId: null, note: 5 },
  });

  // Overlord : un volume + une note attachée à CE volume → exclue de la moyenne série
  const volumeOverlord = await prisma.volume.create({
    data: {
      serieId: series['Overlord'].id,
      numeroVolume: 1,
      titre: 'Overlord Tome 1',
      synopsis: 'Synopsis de test.',
      nbPages: 250,
      couvertureUrl: 'https://example.com/volume-cover-test.jpg',
    },
  });
  await prisma.note.create({
    data: { userId: user1.id, serieId: series['Overlord'].id, volumeId: volumeOverlord.id, note: 3 },
  });

  // Overlord : un commentaire attaché au volume → doit être exclu des commentaires "série"
  await prisma.commentaire.create({
    data: {
      userId: user1.id,
      serieId: series['Overlord'].id,
      volumeId: volumeOverlord.id,
      contenu: 'Commentaire sur le volume, ne doit pas apparaître sur la série.',
    },
  });

  // Sword Art Online : 3 volumes non-consécutifs, pour vérifier le tri (1, 2, 2.5)
  await prisma.volume.createMany({
    data: [
      { serieId: series['Sword Art Online'].id, numeroVolume: 2, titre: 'SAO Tome 2', synopsis: 'Synopsis.', nbPages: 250, couvertureUrl: 'https://example.com/sao-2.jpg' },
      { serieId: series['Sword Art Online'].id, numeroVolume: 1, titre: 'SAO Tome 1', synopsis: 'Synopsis.', nbPages: 250, couvertureUrl: 'https://example.com/sao-1.jpg' },
      { serieId: series['Sword Art Online'].id, numeroVolume: 2.5, titre: 'SAO Tome 2.5', synopsis: 'Synopsis.', nbPages: 250, couvertureUrl: 'https://example.com/sao-2-5.jpg' },
    ],
  });

  // Konosuba : 12 commentaires "série" (volumeId null) → teste la pagination (page 1 = 10, page 2 = 2)
  const commentairesKonosuba = Array.from({ length: 12 }, (_, i) => ({
    userId: i % 2 === 0 ? user1.id : user2.id,
    serieId: series['Konosuba : Sois béni monde merveilleux !'].id,
    volumeId: null,
    contenu: `Commentaire de test numéro ${i + 1}.`,
  }));
  await prisma.commentaire.createMany({ data: commentairesKonosuba });
});

afterAll(async () => {
  await prisma.serie.deleteMany({ where: { id: { in: Object.values(series).map((s) => s.id) } } });
  await prisma.utilisateur.deleteMany({ where: { firebaseUid: { in: ['get-user-1', 'get-user-2'] } } });
  await prisma.genre.deleteMany({ where: { id: { in: [genreFantasy.id, genreIsekai.id] } } });
  await prisma.theme.deleteMany({ where: { id: themeVengeance.id } });
  await prisma.auteur.deleteMany({ where: { id: auteur.id } });
  await prisma.editeur.deleteMany({ where: { id: editeur.id } });
  await prisma.$disconnect();
});

describe('GET /api/series', () => {
  it('Renvoie la première page avec les paramètres par défaut (page=1, limit=12)', async () => {
    const response = await request(app).get('/api/series');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(12);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 12,
      totalItems: 15,
      totalPages: 2,
    });
    expect(response.body.data[0].titre).toBe('86');
  });

  it('Renvoie la bonne page avec page et limit personnalisés', async () => {
    const response = await request(app).get('/api/series?page=2&limit=5');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(5);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 5,
      totalItems: 15,
      totalPages: 3,
    });
  });

  it('Renvoie 400 si limit dépasse 20', async () => {
    const response = await request(app).get('/api/series?limit=100');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Paramètres invalides');
    expect(response.body.error.details).toContain('limit ne peut pas dépasser 20');
  });

  it('Renvoie 400 si page est une string non numérique', async () => {
    const response = await request(app).get('/api/series?page=abc');

    expect(response.status).toBe(400);
    expect(response.body.error.details).toContain('page doit être un entier');
  });

  it('Retombe sur page=1 par défaut si page est une string vide', async () => {
    const response = await request(app).get('/api/series?page=');

    expect(response.status).toBe(200);
    expect(response.body.pagination.page).toBe(1);
  });

  it('Renvoie le bon contenu de card pour une série avec auteur et genres', async () => {
    const response = await request(app).get('/api/series?limit=15');

    const goblinSlayer = response.body.data.find((s) => s.titre === 'Goblin Slayer');

    expect(goblinSlayer.auteur).toBe('Kumo Kagyu');
    expect(goblinSlayer.genres.length).toBeGreaterThan(0);
  });

  it('Renvoie genres: [] et auteur: null pour une série sans genre ni auteur associé', async () => {
    const response = await request(app).get('/api/series?limit=15');

    const serie86 = response.body.data.find((s) => s.titre === '86');

    expect(serie86.genres).toEqual([]);
    expect(serie86.auteur).toBeNull();
  });

  it('Calcule correctement la moyenne des notes "série" et l\'arrondit à 1 décimale', async () => {
    const response = await request(app).get('/api/series?limit=15');

    const mushoku = response.body.data.find(
      (s) => s.titre === 'Mushoku Tensei : Nouvelle vie, nouvelle chance'
    );

    expect(mushoku.noteMoyenne).toBe(4.5);
  });

  it('Exclut les notes attachées à un volume du calcul de la moyenne de la série', async () => {
    const response = await request(app).get('/api/series?limit=15');

    const overlord = response.body.data.find((s) => s.titre === 'Overlord');

    expect(overlord.noteMoyenne).toBeNull();
  });

  it('Renvoie noteMoyenne: null pour une série sans aucune note', async () => {
    const response = await request(app).get('/api/series?limit=15');

    const serie86 = response.body.data.find((s) => s.titre === '86');

    expect(serie86.noteMoyenne).toBeNull();
  });
});


describe('GET /api/series/:id', () => {
  it('Renvoie 200 avec tous les champs attendus pour une série existante', async () => {
    const serieId = series['The Saga of Tanya the Evil'].id;
    const response = await request(app).get(`/api/series/${serieId}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: serieId,
      titre: 'The Saga of Tanya the Evil',
      statut: 'en_cours',
      editeur: { nom: 'Éditeur Test GET' },
    });
    expect(response.body.data).toHaveProperty('synopsis');
    expect(response.body.data).toHaveProperty('couvertureUrl');
  });

  it('Ne renvoie que les titres alternatifs de type anglais et romaji', async () => {
    const serieId = series['The Saga of Tanya the Evil'].id;
    const response = await request(app).get(`/api/series/${serieId}`);

    expect(response.body.data.titresAlternatifs).toHaveLength(2);
    expect(response.body.data.titresAlternatifs).toEqual(
      expect.arrayContaining([
        { titre: 'The Saga of Tanya the Evil', type: 'anglais' },
        { titre: 'Youjo Senki', type: 'romaji' },
      ])
    );
  });

  it('Sépare correctement les genres et les thèmes', async () => {
    const serieId = series['Goblin Slayer'].id;
    const response = await request(app).get(`/api/series/${serieId}`);

    expect(response.body.data.genres).toContain('Fantasy Test');
    expect(response.body.data.genres).not.toContain('Vengeance Test');
    expect(response.body.data.themes).toContain('Vengeance Test');
    expect(response.body.data.themes).not.toContain('Fantasy Test');
  });

  it('Renvoie les auteurs au format "Nom Prénom" dans un tableau', async () => {
    const serieId = series['Goblin Slayer'].id;
    const response = await request(app).get(`/api/series/${serieId}`);

    expect(response.body.data.auteurs).toEqual(['Kumo Kagyu']);
  });

  it('Renvoie les volumes triés par numeroVolume croissant, au format allégé', async () => {
    const serieId = series['Sword Art Online'].id;
    const response = await request(app).get(`/api/series/${serieId}`);

    expect(response.body.data.volumes).toHaveLength(3);
    expect(response.body.data.volumes.map((v) => v.numeroVolume)).toEqual(['1', '2', '2.5']);
    expect(Object.keys(response.body.data.volumes[0])).toEqual(['id', 'numeroVolume', 'couvertureUrl']);
  });

  it('Exclut du calcul de la moyenne les notes attachées à un volume', async () => {
    const serieId = series['Overlord'].id;
    const response = await request(app).get(`/api/series/${serieId}`);

    expect(response.body.data.noteMoyenne).toBeNull();
  });

  it('Pagine les commentaires avec la limite par défaut (10)', async () => {
    const serieId = series['Konosuba : Sois béni monde merveilleux !'].id;
    const response = await request(app).get(`/api/series/${serieId}`);

    expect(response.body.data.commentaires.data).toHaveLength(10);
    expect(response.body.data.commentaires.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 12,
      totalPages: 2,
    });
  });

  it('Renvoie la seconde page de commentaires avec commentPage=2', async () => {
    const serieId = series['Konosuba : Sois béni monde merveilleux !'].id;
    const response = await request(app).get(`/api/series/${serieId}?commentPage=2`);

    expect(response.body.data.commentaires.data).toHaveLength(2);
    expect(response.body.data.commentaires.pagination.page).toBe(2);
  });

  it('Trie les commentaires du plus ancien au plus récent', async () => {
    const serieId = series['Konosuba : Sois béni monde merveilleux !'].id;
    const response = await request(app).get(`/api/series/${serieId}`);

    expect(response.body.data.commentaires.data[0].contenu).toBe('Commentaire de test numéro 1.');
  });

  it('Exclut les commentaires attachés à un volume', async () => {
    const serieId = series['Overlord'].id;
    const response = await request(app).get(`/api/series/${serieId}`);

    expect(response.body.data.commentaires.data).toHaveLength(0);
    expect(response.body.data.commentaires.pagination.totalItems).toBe(0);
  });

  it('Renvoie 400 si commentLimit dépasse 20', async () => {
    const serieId = series['Konosuba : Sois béni monde merveilleux !'].id;
    const response = await request(app).get(`/api/series/${serieId}?commentLimit=100`);

    expect(response.status).toBe(400);
    expect(response.body.error.details).toContain('commentLimit ne peut pas dépasser 20');
  });

  it('Renvoie 400 si id est non numérique', async () => {
    const response = await request(app).get('/api/series/abc');

    expect(response.status).toBe(400);
    expect(response.body.error.details).toContain('id doit être un entier');
  });

  it('Renvoie 404 si la série est introuvable', async () => {
    const response = await request(app).get('/api/series/999999');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Série introuvable');
  });
});
