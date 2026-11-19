import { registerBodySchema, pseudoSchema } from '../../src/API/validators/users.validator.js';

describe('pseudoSchema', () => {
  it('Accepte un pseudo valide', () => {
    const result = pseudoSchema.safeParse('Shinigami');
    expect(result.success).toBe(true);
    expect(result.data).toBe('Shinigami');
  });

  it('Accepte les caractères spéciaux autorisés (espace, @, -, _, apostrophe)', () => {
    const result = pseudoSchema.safeParse("Ayan-o_koji@1'");
    expect(result.success).toBe(true);
  });

  it('Retire les espaces en début/fin (trim)', () => {
    const result = pseudoSchema.safeParse('  Shinigami  ');
    expect(result.success).toBe(true);
    expect(result.data).toBe('Shinigami');
  });

  it('Accepte un pseudo de 3 caractères (limite basse)', () => {
    const result = pseudoSchema.safeParse('abc');
    expect(result.success).toBe(true);
    expect(result.data).toBe('abc');
  });

  it('Accepte un pseudo de 20 caractères (limite haute)', () => {
    const pseudo = 'a'.repeat(20);
    const result = pseudoSchema.safeParse(pseudo);
    expect(result.success).toBe(true);
    expect(result.data).toBe(pseudo);
  });

  it('Rejette un pseudo trop court (< 3 caractères)', () => {
    const result = pseudoSchema.safeParse('ab');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le pseudo doit contenir au moins 3 caractères');
  });

  it('Rejette un pseudo trop long (> 20 caractères)', () => {
    const result = pseudoSchema.safeParse('a'.repeat(21));
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le pseudo ne peut pas dépasser 20 caractères');
  });

  it('Applique le trim avant le contrôle de longueur (" ab " est rejeté)', () => {
    const result = pseudoSchema.safeParse(' ab ');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le pseudo doit contenir au moins 3 caractères');
  });

  it('Applique le trim avant le contrôle de longueur max (20 caractères + espaces accepté)', () => {
    const pseudo = 'a'.repeat(20);
    const result = pseudoSchema.safeParse(`  ${pseudo}  `);
    expect(result.success).toBe(true);
    expect(result.data).toBe(pseudo);
  });

  it('Rejette un pseudo avec des caractères non autorisés', () => {
    const result = pseudoSchema.safeParse('Shinigami!');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le pseudo contient des caractères non autorisés');
  });

  it('Rejette une valeur non-string', () => {
    const result = pseudoSchema.safeParse(12345);
    expect(result.success).toBe(false);
  });

  it('Accepte les caractères accentués français', () => {
    const result = pseudoSchema.safeParse('Élodie-Chloé');
    expect(result.success).toBe(true);
    expect(result.data).toBe('Élodie-Chloé');
  });

  it('Accepte les ligatures (œ, Œ)', () => {
    expect(pseudoSchema.safeParse('Cœur').success).toBe(true);
    expect(pseudoSchema.safeParse('Œdipe').success).toBe(true);
  });

  it("Normalise l'apostrophe typographique ’ en apostrophe droite", () => {
    const result = pseudoSchema.safeParse('L\u2019as'); // \u2019 → ’
    expect(result.success).toBe(true);
    expect(result.data).toBe("L'as");
  });

  it("Normalise aussi l'apostrophe ouvrante ‘ en apostrophe droite", () => {
    const result = pseudoSchema.safeParse('L\u2018as'); // \u2018 → ‘
    expect(result.success).toBe(true);
    expect(result.data).toBe("L'as");
  });

  it("Garde l'apostrophe droite inchangée", () => {
    const result = pseudoSchema.safeParse("L'as");
    expect(result.success).toBe(true);
    expect(result.data).toBe("L'as");
  });

  it('Normalise un accent décomposé (NFD) en NFC', () => {
    const result = pseudoSchema.safeParse('E\u0301lodie'); // E + accent combinant
    expect(result.success).toBe(true);
    expect(result.data).toBe('Élodie');
  });

  it("Compte la longueur après normalisation (3 caractères avec apostrophe typographique)", () => {
    const result = pseudoSchema.safeParse('a\u2019b'); // \u2019 → ’
    expect(result.success).toBe(true);
    expect(result.data).toBe("a'b");
  });

  it('Rejette les lettres hors alphabet latin (cyrillique)', () => {
    const result = pseudoSchema.safeParse('Дмитрий');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le pseudo contient des caractères non autorisés');
  });

  it('Rejette les lettres latines étendues hors plage retenue (ex: Ł)', () => {
    const result = pseudoSchema.safeParse('Łukasz');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le pseudo contient des caractères non autorisés');
  });

  it('Rejette les symboles × et ÷ (exclus de la plage Latin-1)', () => {
    expect(pseudoSchema.safeParse('ab\u00d7cd').success).toBe(false); // 00d7 → × (Pas le "x" de l'alphabet.)
    expect(pseudoSchema.safeParse('ab÷cd').success).toBe(false);
  });
});

describe('registerBodySchema', () => {
  it('Accepte un body valide', () => {
    const result = registerBodySchema.safeParse({ pseudo: 'Shinigami' });
    expect(result.success).toBe(true);
  });

  it('Rejette un body sans pseudo', () => {
    const result = registerBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
