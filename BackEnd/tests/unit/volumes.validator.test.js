import { createVolumeBodySchema } from '../../src/API/validators/volumes.validator.js';

const validPayload = {
  numeroVolume: '1',
  titre: 'Classroom of the Elite',
  synopsis: 'Ayanokôji intègre la classe D du lycée.',
  nbPages: '320',
};

describe('createVolumeBodySchema', () => {
  it('Accepte un payload valide minimal (sans champs optionnels)', () => {
    const result = createVolumeBodySchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('Accepte un payload valide complet (avec isbn et dateSortie)', () => {
    const result = createVolumeBodySchema.safeParse({
      ...validPayload,
      isbn: '9782811632455',
      dateSortie: '2024-02-23',
    });

    expect(result.success).toBe(true);
    expect(result.data.isbn).toBe('9782811632455');
    expect(result.data.dateSortie).toBeInstanceOf(Date);
  });

  it('Accepte numeroVolume à 0 (volume préquel)', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, numeroVolume: '0' });
    expect(result.success).toBe(true);
    expect(result.data.numeroVolume).toBe(0);
  });

  it('Accepte numeroVolume avec une décimale (ex: 4.5)', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, numeroVolume: '4.5' });
    expect(result.success).toBe(true);
  });

  it('Rejette numeroVolume négatif', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, numeroVolume: '-1' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le numéro de volume ne peut pas être négatif');
  });

  it('Rejette numeroVolume au-delà de 999.9', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, numeroVolume: '1000' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le numéro de volume ne peut pas dépasser 999.9');
  });

  it("Rejette numeroVolume avec plus d'une décimale (ex: 2.55)", () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, numeroVolume: '2.55' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe(
      "Le numéro de volume ne peut avoir qu'une seule décimale (ex: 1, 2.5)"
    );
  });

  it('Rejette un titre vide', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, titre: '' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le titre du volume est obligatoire');
  });

  it('Rejette un titre trop long (> 150 caractères)', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, titre: 'a'.repeat(151) });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le titre du volume ne peut pas dépasser 150 caractères');
  });

  it('Rejette un synopsis trop court (< 10 caractères)', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, synopsis: 'court' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le synopsis doit contenir au moins 10 caractères');
  });

  it('Rejette nbPages non entier', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, nbPages: '320.5' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le nombre de pages doit être un entier');
  });

  it('Rejette nbPages négatif', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, nbPages: '-5' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le nombre de pages doit être positif');
  });

  it('Rejette nbPages au-delà de 1000', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, nbPages: '1500' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le nombre de pages ne peut pas dépasser 1000');
  });

  it('Traite un isbn vide (string vide) comme absent', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, isbn: '' });
    expect(result.success).toBe(true);
    expect(result.data.isbn).toBeUndefined();
  });

  it('Accepte un ISBN-13 avec tirets et les retire', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, isbn: '978-2-8116-3245-5' });
    expect(result.success).toBe(true);
    expect(result.data.isbn).toBe('9782811632455');
  });

  it('Accepte un ISBN-10 se terminant par X', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, isbn: '123456789X' });
    expect(result.success).toBe(true);
  });

  it('Rejette un ISBN de format invalide', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, isbn: '123' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Format ISBN invalide (ISBN-10 ou ISBN-13 attendu)');
  });

  it('Traite une dateSortie vide (string vide) comme absente', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, dateSortie: '' });
    expect(result.success).toBe(true);
    expect(result.data.dateSortie).toBeUndefined();
  });

  it('Rejette une dateSortie invalide', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, dateSortie: 'pas-une-date' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Date de sortie invalide');
  });

  it('Accepte une dateSortie dans le futur (préparation aux annonces de sortie)', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const result = createVolumeBodySchema.safeParse({
      ...validPayload,
      dateSortie: futureDate.toISOString().split('T')[0],
    });

    expect(result.success).toBe(true);
  });

    it('Rejette numeroVolume avec une valeur non numérique', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, numeroVolume: 'abc' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le numéro de volume doit être un nombre');
  });

  it('Rejette nbPages avec une valeur non numérique', () => {
    const result = createVolumeBodySchema.safeParse({ ...validPayload, nbPages: 'abc' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le nombre de pages doit être un nombre');
  });
});