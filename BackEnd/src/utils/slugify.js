export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents (décompose puis supprime les diacritiques)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // tout caractère non alphanumérique -> -
    .replace(/-+/g, '-') // fusionne les tirets multiples
    .replace(/^-|-$/g, ''); // trim les tirets en début/fin
}
