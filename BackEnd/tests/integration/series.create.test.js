import request from 'supertest';
import prisma from '../../src/db/client.js';
import app from '../../src/app.js';
import { firebaseAuth } from '../../src/config/firebase.js';
import { uploadImageToCloudinary } from '../../src/utils/uploadImage.js';
import cloudinary from '../../src/config/cloudinary.js';

jest.mock('../../src/config/firebase.js', () => ({
  firebaseAuth: {
    verifyIdToken: jest.fn(),
  },
}));

jest.mock('../../src/utils/uploadImage.js', () => ({
  uploadImageToCloudinary: jest.fn(),
}));

jest.mock('../../src/config/cloudinary.js', () => ({
  __esModule: true,
  default: {
    uploader: {
      destroy: jest.fn(),
    },
  },
}));

// PNG 1x1 pixel valide, en dur (évite de dépendre d'un fichier externe)
const FAKE_IMAGE_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

let adminUser;
let editeur;

beforeEach(async () => {
  adminUser = await prisma.utilisateur.create({
    data: {
      firebaseUid: 'admin-uid',
      email: 'admin@example.com',
      pseudo: 'AdminTest',
      avatarUrl: 'https://example.com/avatar.png',
      role: 'admin',
    },
  });

  editeur = await prisma.editeur.create({
    data: { nom: 'Éditeur Test' },
  });

  uploadImageToCloudinary.mockResolvedValue({
    url: 'https://res.cloudinary.com/fake/Series/test/cover.jpg',
    publicId: 'Series/test/cover',
  });
});

afterEach(async () => {
  jest.clearAllMocks();
  await prisma.serie.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.editeur.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});


describe('POST /api/series', () => {
  it('Crée une série avec un admin, des données valides et une image (sans titre diminutif)', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post('/api/series')
      .set('Authorization', 'Bearer fake-token')
      .field('titre', 'Solo Leveling')
      .field('synopsis', 'Un chasseur faible devient le plus puissant.')
      .field('statut', 'en_cours')
      .field('editeurId', String(editeur.id))
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      titre: 'Solo Leveling',
      synopsis: 'Un chasseur faible devient le plus puissant.',
      statut: 'en_cours',
      editeurId: editeur.id,
      couvertureUrl: 'https://res.cloudinary.com/fake/Series/test/cover.jpg',
    });

    expect(uploadImageToCloudinary).toHaveBeenCalledWith(
      expect.any(Buffer),
      'Series/solo-leveling'
    );

    const serieEnBase = await prisma.serie.findUnique({
      where: { id: response.body.data.id },
    });
    expect(serieEnBase).not.toBeNull();

    const titreAlternatifEnBase = await prisma.titreAlternatif.findFirst({
      where: { serieId: response.body.data.id },
    });
    expect(titreAlternatifEnBase).toBeNull();
  });

  it("Crée une série avec un titre diminutif, et l'enregistre comme TitreAlternatif", async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post('/api/series')
      .set('Authorization', 'Bearer fake-token')
      .field('titre', 'Re:Zero : Re:Vivre dans un autre monde à partir de zéro')
      .field('synopsis', 'Subaru se retrouve transporté dans un monde parallèle.')
      .field('statut', 'en_cours')
      .field('editeurId', String(editeur.id))
      .field('titreDiminutif', 'Re:Zero')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(201);

    expect(uploadImageToCloudinary).toHaveBeenCalledWith(
      expect.any(Buffer),
      'Series/re-zero'
    );

    const titreAlternatifEnBase = await prisma.titreAlternatif.findFirst({
      where: { serieId: response.body.data.id },
    });
    expect(titreAlternatifEnBase).toMatchObject({
      titre: 'Re:Zero',
      type: 'diminutif',
    });
  });

  it('Renvoie 409 si une série avec le même titre existe déjà (insensible à la casse)', async () => {
    await prisma.serie.create({
      data: {
        titre: 'Danmachi',
        synopsis: 'Un aventurier explore un donjon.',
        statut: 'en_cours',
        couvertureUrl: 'https://example.com/existing-cover.jpg',
        editeurId: editeur.id,
      },
    });

    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post('/api/series')
      .set('Authorization', 'Bearer fake-token')
      .field('titre', 'danmachi')
      .field('synopsis', 'Une autre description.')
      .field('statut', 'en_cours')
      .field('editeurId', String(editeur.id))
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('Une série avec ce titre existe déjà');

    expect(uploadImageToCloudinary).not.toHaveBeenCalled();

    const seriesEnBase = await prisma.serie.count();
    expect(seriesEnBase).toBe(1);
  });

  it("Renvoie 400 si l'éditeur n'existe pas", async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post('/api/series')
      .set('Authorization', 'Bearer fake-token')
      .field('titre', 'Bungo Stray Dogs')
      .field('synopsis', 'Le passé de Dazai, les raisons pour lesquelles il a quitté la mafia...')
      .field('statut', 'en_cours')
      .field('editeurId', '999999')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Éditeur introuvable');

    expect(uploadImageToCloudinary).not.toHaveBeenCalled();

    const serieEnBase = await prisma.serie.findFirst({
      where: { titre: 'Bungo Stray Dogs' },
    });
    expect(serieEnBase).toBeNull();
  });

  it('Renvoie 400 si le fichier cover est manquant', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post('/api/series')
      .set('Authorization', 'Bearer fake-token')
      .field('titre', 'Overlord')
      .field('synopsis', 'Un joueur reste bloqué dans son MMORPG favori.')
      .field('statut', 'en_cours')
      .field('editeurId', String(editeur.id));

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('La couverture de la série est obligatoire');

    expect(uploadImageToCloudinary).not.toHaveBeenCalled();

    const serieEnBase = await prisma.serie.findFirst({
      where: { titre: 'Overlord' },
    });
    expect(serieEnBase).toBeNull();
  });

  it('Renvoie 400 si le statut est invalide', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post('/api/series')
      .set('Authorization', 'Bearer fake-token')
      .field('titre', 'Mushoku Tensei : Nouvelle vie, nouvelle chance')
      .field('synopsis', 'Un homme renaît dans un monde fantastique.')
      .field('statut', 'cancelled')
      .field('editeurId', String(editeur.id))
      .field('titreDiminutif', 'Mushoku Tensei')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Données invalides');
    expect(response.body.error.details).toContain('Statut invalide');

    expect(uploadImageToCloudinary).not.toHaveBeenCalled();

    const serieEnBase = await prisma.serie.findFirst({
      where: { titre: 'Mushoku Tensei : Nouvelle vie, nouvelle chance' },
    });
    expect(serieEnBase).toBeNull();
  });

  it('Renvoie 400 si le fichier cover a un type MIME non supporté', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post('/api/series')
      .set('Authorization', 'Bearer fake-token')
      .field('titre', 'Konosuba : Sois béni monde merveilleux !')
      .field('synopsis', 'Une aventurière maladroite et ses compagnons loufoques.')
      .field('statut', 'en_cours')
      .field('editeurId', String(editeur.id))
      .field('titreDiminutif', 'Konosuba')
      .attach('cover', Buffer.from('contenu texte quelconque'), {
        filename: 'cover.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Format de fichier non supporté (JPEG, PNG ou WEBP uniquement)');

    expect(uploadImageToCloudinary).not.toHaveBeenCalled();

    const serieEnBase = await prisma.serie.findFirst({
      where: { titre: 'Konosuba : Sois béni monde merveilleux !' },
    });
    expect(serieEnBase).toBeNull();
  });

  it("Renvoie 403 si l'utilisateur n'est pas admin", async () => {
    await prisma.utilisateur.create({
      data: {
        firebaseUid: 'simple-user-uid',
        email: 'user@example.com',
        pseudo: 'SimpleUser',
        avatarUrl: 'https://example.com/avatar.png',
        role: 'user',
      },
    });

    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'simple-user-uid',
      email: 'user@example.com',
    });

    const response = await request(app)
      .post('/api/series')
      .set('Authorization', 'Bearer fake-token')
      .field('titre', 'My Teen Romantic Comedy is Wrong as I Expected')
      .field('synopsis', "Hikigaya Hachiman est un élève préférant la solitude plutôt que de vivre dans le mensonge de l'amitié...")
      .field('statut', 'termine')
      .field('editeurId', String(editeur.id))
      .field('titreDiminutif', 'Oregairu')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('Accès réservé aux administrateurs');

    expect(uploadImageToCloudinary).not.toHaveBeenCalled();

    const serieEnBase = await prisma.serie.findFirst({
      where: { titre: 'My Teen Romantic Comedy is Wrong as I Expected' },
    });
    expect(serieEnBase).toBeNull();
  });
});
