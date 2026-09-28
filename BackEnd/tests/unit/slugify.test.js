import { slugify } from '../../src/utils/slugify.js';

describe('slugify', () => {
  it('convertit un titre simple en minuscules avec des tirets', () => {
    expect(slugify('Classroom of the Elite')).toBe('classroom-of-the-elite');
  });

  it('retire les accents', () => {
    expect(slugify('Re:Zero : Re:Vivre dans un autre monde à partir de zéro'))
      .toBe('re-zero-re-vivre-dans-un-autre-monde-a-partir-de-zero');
  });

  it('remplace les caractères spéciaux par des tirets', () => {
    expect(slugify('Re:Zero')).toBe('re-zero');
  });

  it('fusionne les tirets multiples consécutifs', () => {
    expect(slugify('Danmachi  --  La Légende des Familias')).toBe('danmachi-la-legende-des-familias');
  });

  it('retire les tirets en début et fin de chaîne', () => {
    expect(slugify('!Solo Leveling!')).toBe('solo-leveling');
  });

  it('gère un titre déjà en minuscules sans changement notable', () => {
    expect(slugify('danmachi')).toBe('danmachi');
  });
});