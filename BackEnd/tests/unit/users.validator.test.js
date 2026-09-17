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

  it('Rejette un pseudo avec des caractères non autorisés', () => {
    const result = pseudoSchema.safeParse('Shinigami!');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Le pseudo contient des caractères non autorisés');
  });

  it('Rejette une valeur non-string', () => {
    const result = pseudoSchema.safeParse(12345);
    expect(result.success).toBe(false);
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