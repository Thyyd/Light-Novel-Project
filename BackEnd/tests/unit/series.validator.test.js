import { createSerieBodySchema } from '../../src/API/validators/series.validator.js';

const validPayload = {
  titre: 'Solo Leveling',
  synopsis: 'Un chasseur faible devient le plus puissant.',
  statut: 'en_cours',
  editeurId: '1',
};

describe('createSerieBodySchema', () => {
  it('Accepte un payload valide minimal (sans champs optionnels)', () => {
    const result = createSerieBodySchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('Accepte un payload valide complet (avec champs optionnels)', () => {
    const result = createSerieBodySchema.safeParse({
      ...validPayload,
      dateDebutPublicationFr: '2018-11-04',
      titreDiminutif: 'Solo Leveling',
    });

    expect(result.success).toBe(true);
    expect(result.data.dateDebutPublicationFr).toBeInstanceOf(Date);
    expect(result.data.titreDiminutif).toBe('Solo Leveling');
  });

  it('Retire les espaces en début/fin du titre et du synopsis (trim)', () => {
    const result = createSerieBodySchema.safeParse({
      ...validPayload,
      titre: '  Solo Leveling  ',
      synopsis: '  Un chasseur faible devient le plus puissant.  ',
    });

    expect(result.success).toBe(true);
    expect(result.data.titre).toBe('Solo Leveling');
    expect(result.data.synopsis).toBe('Un chasseur faible devient le plus puissant.');
  });

  it('Rejette un titre vide', () => {
    const result = createSerieBodySchema.safeParse({ ...validPayload, titre: '' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le titre est obligatoire');
  });

  it('Rejette un titre trop long (> 150 caractères)', () => {
    const result = createSerieBodySchema.safeParse({ ...validPayload, titre: 'a'.repeat(151) });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le titre ne peut pas dépasser 150 caractères');
  });

  it('Rejette un synopsis vide', () => {
    const result = createSerieBodySchema.safeParse({ ...validPayload, synopsis: '' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le synopsis est obligatoire');
  });

  it('Rejette un statut invalide', () => {
    const result = createSerieBodySchema.safeParse({ ...validPayload, statut: 'cancelled' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Statut invalide');
  });

  it.each(['en_cours', 'termine', 'en_pause', 'abandonne'])(
    'Accepte le statut "%s"',
    (statut) => {
      const result = createSerieBodySchema.safeParse({ ...validPayload, statut });
      expect(result.success).toBe(true);
    }
  );

  it('Rejette une dateDebutPublicationFr mal formatée', () => {
    const result = createSerieBodySchema.safeParse({
      ...validPayload,
      dateDebutPublicationFr: '04/11/2018',
    });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Date invalide (format attendu : AAAA-MM-JJ)');
  });

  it('Accepte editeurId sous forme de string ou de number', () => {
    const resultString = createSerieBodySchema.safeParse({ ...validPayload, editeurId: '5' });
    const resultNumber = createSerieBodySchema.safeParse({ ...validPayload, editeurId: 5 });

    expect(resultString.success).toBe(true);
    expect(resultString.data.editeurId).toBe(5);
    expect(resultNumber.success).toBe(true);
    expect(resultNumber.data.editeurId).toBe(5);
  });

  it('Rejette un editeurId négatif', () => {
    const result = createSerieBodySchema.safeParse({ ...validPayload, editeurId: '-1' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('editeurId doit être positif');
  });

  it('Rejette un editeurId non entier', () => {
    const result = createSerieBodySchema.safeParse({ ...validPayload, editeurId: '1.5' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('editeurId doit être un entier');
  });

  it('Traite un titreDiminutif vide (string vide) comme absent', () => {
    const result = createSerieBodySchema.safeParse({ ...validPayload, titreDiminutif: '' });
    expect(result.success).toBe(true);
    expect(result.data.titreDiminutif).toBeUndefined();
  });

  it('Rejette un titreDiminutif trop long (> 50 caractères)', () => {
    const result = createSerieBodySchema.safeParse({ ...validPayload, titreDiminutif: 'a'.repeat(51) });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le titre diminutif ne peut pas dépasser 50 caractères');
  });
});