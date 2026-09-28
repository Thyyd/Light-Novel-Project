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
let serie;

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

  serie = await prisma.serie.create({
    data: {
      titre: 'Classroom of the Elite',
      synopsis: 'Un lycée où la liberté cache un système impitoyable.',
      statut: 'en_cours',
      couvertureUrl: 'https://example.com/existing-cover.jpg',
      editeurId: editeur.id,
    },
  });

  uploadImageToCloudinary.mockResolvedValue({
    url: 'https://res.cloudinary.com/fake/Series/classroom-of-the-elite/volumes/cover.jpg',
    publicId: 'Series/classroom-of-the-elite/volumes/cover',
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

describe('POST /api/series/:id/volumes', () => {
  it('Crée un volume avec un admin, des données valides et une image', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post(`/api/series/${serie.id}/volumes`)
      .set('Authorization', 'Bearer fake-token')
      .field('numeroVolume', '1')
      .field('titre', 'Classroom of the Elite')
      .field('synopsis', 'Ayanokôji intègre la classe D du lycée.')
      .field('nbPages', '320')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      serieId: serie.id,
      titre: 'Classroom of the Elite',
      nbPages: 320,
      isbn: null,
      couvertureUrl: 'https://res.cloudinary.com/fake/Series/classroom-of-the-elite/volumes/cover.jpg',
    });

    expect(uploadImageToCloudinary).toHaveBeenCalledWith(
      expect.any(Buffer),
      'Series/classroom-of-the-elite/volumes'
    );

    const volumeEnBase = await prisma.volume.findUnique({
      where: { id: response.body.data.id },
    });
    expect(volumeEnBase).not.toBeNull();
  });

  it('Accepte le volume 0 (préquel)', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post(`/api/series/${serie.id}/volumes`)
      .set('Authorization', 'Bearer fake-token')
      .field('numeroVolume', '0')
      .field('titre', 'Volume préquel')
      .field('synopsis', 'Un préquel racontant les origines.')
      .field('nbPages', '150')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(201);
    expect(response.body.data.numeroVolume).toBe('0');
  });

  it('Utilise le slug du titre diminutif de la série pour le dossier Cloudinary', async () => {
    await prisma.titreAlternatif.create({
      data: {
        serieId: serie.id,
        titre: 'Cote',
        type: 'diminutif',
      },
    });

    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    await request(app)
      .post(`/api/series/${serie.id}/volumes`)
      .set('Authorization', 'Bearer fake-token')
      .field('numeroVolume', '1')
      .field('titre', 'Volume 1')
      .field('synopsis', 'Synopsis suffisamment long pour passer.')
      .field('nbPages', '300')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(uploadImageToCloudinary).toHaveBeenCalledWith(
      expect.any(Buffer),
      'Series/cote/volumes'
    );
  });

  it('Renvoie 409 si le numéro de volume existe déjà pour cette série', async () => {
    await prisma.volume.create({
      data: {
        serieId: serie.id,
        numeroVolume: 1,
        titre: 'Volume 1 existant',
        synopsis: 'Synopsis suffisamment long pour passer.',
        nbPages: 300,
        couvertureUrl: 'https://example.com/existing-volume-cover.jpg',
      },
    });

    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post(`/api/series/${serie.id}/volumes`)
      .set('Authorization', 'Bearer fake-token')
      .field('numeroVolume', '1')
      .field('titre', 'Doublon')
      .field('synopsis', 'Synopsis suffisamment long pour passer.')
      .field('nbPages', '300')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('Ce numéro de volume existe déjà pour cette série');

    expect(uploadImageToCloudinary).not.toHaveBeenCalled();

    const volumesEnBase = await prisma.volume.count({ where: { serieId: serie.id } });
    expect(volumesEnBase).toBe(1);
  });

  it("Renvoie 409 si l'ISBN existe déjà (peu importe la série)", async () => {
    await prisma.volume.create({
      data: {
        serieId: serie.id,
        numeroVolume: 1,
        titre: 'Volume 1 existant',
        synopsis: 'Synopsis suffisamment long pour passer.',
        nbPages: 300,
        isbn: '9782811632462',
        couvertureUrl: 'https://example.com/existing-volume-cover.jpg',
      },
    });

    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post(`/api/series/${serie.id}/volumes`)
      .set('Authorization', 'Bearer fake-token')
      .field('numeroVolume', '2')
      .field('titre', 'Volume 2')
      .field('synopsis', 'Synopsis suffisamment long pour passer.')
      .field('nbPages', '300')
      .field('isbn', '9782811632462')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('Cet ISBN est déjà utilisé');

    expect(uploadImageToCloudinary).not.toHaveBeenCalled();
  });

  it("Renvoie 404 si la série n'existe pas", async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post('/api/series/999999/volumes')
      .set('Authorization', 'Bearer fake-token')
      .field('numeroVolume', '1')
      .field('titre', 'Volume 1')
      .field('synopsis', 'Synopsis suffisamment long pour passer.')
      .field('nbPages', '300')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Série introuvable');

    expect(uploadImageToCloudinary).not.toHaveBeenCalled();
  });

  it('Renvoie 400 si le paramètre :id est invalide', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post('/api/series/abc/volumes')
      .set('Authorization', 'Bearer fake-token')
      .field('numeroVolume', '1')
      .field('titre', 'Volume 1')
      .field('synopsis', 'Synopsis suffisamment long pour passer.')
      .field('nbPages', '300')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Identifiant de série invalide');
  });

  it('Renvoie 400 si le fichier cover est manquant', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post(`/api/series/${serie.id}/volumes`)
      .set('Authorization', 'Bearer fake-token')
      .field('numeroVolume', '1')
      .field('titre', 'Volume 1')
      .field('synopsis', 'Synopsis suffisamment long pour passer.')
      .field('nbPages', '300');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('La couverture du volume est obligatoire');

    expect(uploadImageToCloudinary).not.toHaveBeenCalled();
  });

  it.each([
    ['numeroVolume', '-1'],
    ['numeroVolume', '2.55'],
    ['nbPages', '1500'],
    ['nbPages', '-5'],
    ['isbn', '123'],
  ])('Renvoie 400 si %s vaut "%s"', async (field, value) => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const fields = {
      numeroVolume: '1',
      titre: 'Volume 1',
      synopsis: 'Synopsis suffisamment long pour passer.',
      nbPages: '300',
      [field]: value, // écrase la valeur par défaut avant l'envoi, pas après
    };

    let req = request(app)
      .post(`/api/series/${serie.id}/volumes`)
      .set('Authorization', 'Bearer fake-token');

    for (const [key, val] of Object.entries(fields)) {
      req = req.field(key, val);
    }

    const response = await req.attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(400);
    expect(uploadImageToCloudinary).not.toHaveBeenCalled();
  });

  it('Renvoie 400 si le titre est vide', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post(`/api/series/${serie.id}/volumes`)
      .set('Authorization', 'Bearer fake-token')
      .field('numeroVolume', '1')
      .field('titre', '')
      .field('synopsis', 'Synopsis suffisamment long pour passer.')
      .field('nbPages', '300')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(400);
  });

  it('Renvoie 400 si le synopsis est trop court', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({
      uid: 'admin-uid',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .post(`/api/series/${serie.id}/volumes`)
      .set('Authorization', 'Bearer fake-token')
      .field('numeroVolume', '1')
      .field('titre', 'Volume 1')
      .field('synopsis', 'court')
      .field('nbPages', '300')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(400);
  });

  it("Renvoie 401 si l'utilisateur n'est pas authentifié", async () => {
    const response = await request(app)
      .post(`/api/series/${serie.id}/volumes`)
      .field('numeroVolume', '1')
      .field('titre', 'Volume 1')
      .field('synopsis', 'Synopsis suffisamment long pour passer.')
      .field('nbPages', '300')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(401);
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
      .post(`/api/series/${serie.id}/volumes`)
      .set('Authorization', 'Bearer fake-token')
      .field('numeroVolume', '1')
      .field('titre', 'Volume 1')
      .field('synopsis', 'Synopsis suffisamment long pour passer.')
      .field('nbPages', '300')
      .attach('cover', FAKE_IMAGE_BUFFER, 'cover.png');

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('Accès réservé aux administrateurs');

    expect(uploadImageToCloudinary).not.toHaveBeenCalled();
  });
});
