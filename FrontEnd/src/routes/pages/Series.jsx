import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/general/Card';
import Button from '../../components/general/Button';

function Series() {
  const { user } = useAuth();

  const [series, setSeries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalItems: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    axios.get('/api/series', { params: { page } })
      .then((response) => {
        setSeries(response.data.data);
        setPagination(response.data.pagination);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page]);

  // TODO: calcule les numéros de page à afficher autour de `page`, avec les "…"
  function getPageNumbers() {
    const siblingCount = 1; // nombre de pages voisines affichées de chaque côté de `page`
    const { totalPages } = pagination;
    const pages = [];

    const leftSibling = Math.max(page - siblingCount, 1);
    const rightSibling = Math.min(page + siblingCount, totalPages);

    const showLeftEllipsis = leftSibling > 2;
    const showRightEllipsis = rightSibling < totalPages - 1;

    // La borne de gauche (page 1) est toujours affichée
    pages.push(1);

    if (showLeftEllipsis) {
      pages.push('…');
    }
    else {
      // Pas assez d'écart pour une ellipse : on remplit les numéros manquants entre 1 et leftSibling
      for (let i = 2; i < leftSibling; i++) {
        pages.push(i);
      }
    }

    // Le voisinage autour de la page courante (en excluant les bornes déjà gérées)
    for (let i = leftSibling; i <= rightSibling; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    if (showRightEllipsis) {
      pages.push('…');
    }
    else {
      for (let i = rightSibling + 1; i < totalPages; i++) {
        pages.push(i);
      }
    }

    // La borne de droite (dernière page), seulement si elle n'a pas déjà été poussée par la boucle du dessus
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }

  return (
    <div className="series-page px-10 py-8">
      <div className="series-header flex items-center justify-between mb-6">
        <h2 className="font-title text-3xl font-bold text-black">Catalogue de séries</h2>
        {user?.role === 'admin' && (
          <Button label="+ Ajouter une Série" className={"add-series font-body"} onClick={() => {}} />
        )}
      </div>

      <div className="series-filters flex flex-col items-center mb-6 font-body">
        <input
          type="search"
          placeholder="Rechercher une série par nom..."
          className="w-full max-w-300 shadow-sm bg-white text-black text-sm placeholder-[#777777] px-4 py-2.5 rounded-xl"
        />

        {/* Ligne de filtres Desktop — visuelle uniquement pour le v0 */}
        <div className="series-filters-desktop w-full max-w-300 hidden md:flex md:flex-row md:items-center md:justify-between mt-8">
          <div className="filtres flex gap-3">
            <select
              defaultValue=""
              className="border border-[#999999] rounded-md bg-white text-[#333333] font-body font-semibold px-2 py-1"
            >
              <option value="" disabled>Genre</option>
            </select>
            <select
              defaultValue=""
              className="border border-[#999999] rounded-md bg-white text-[#333333] font-body font-semibold px-2 py-1"
            >
              <option value="" disabled>Thème</option>
            </select>
            <select
              defaultValue=""
              className="border border-[#999999] rounded-md bg-white text-[#333333] font-body font-semibold px-2 py-1"
            >
              <option value="" disabled>Éditeur</option>
            </select>
            <select
              defaultValue=""
              className="border border-[#999999] rounded-md bg-white text-[#333333] font-body font-semibold px-2 py-1"
            >
              <option value="" disabled>Statut</option>
            </select>
          </div>

          <div className="tri md:flex">
            <select
              defaultValue=""
              className="border border-[#999999] rounded-md bg-white text-[#333333] font-body font-semibold px-2 py-1"
            >
              <option value="" disabled>Trier : A → Z</option>
            </select>
          </div>
        </div>

        {/* Bouton Mobile — sans comportement pour le v0 */}
        <button
          type="button"
          className="series-filters-mobile-toggle md:hidden w-full max-w-300 bg-white text-black border
          font-body font-semibold border-[#999999] px-4 py-2.5 rounded-xl mt-4"
        >
          Filtrer &amp; trier
        </button>
      </div>

      <div className="series-cards-container">
        <ul className="series-cards flex flex-wrap justify-center gap-4 px-8 pt-4">
          {loading && <li>Chargement...</li>}
          {!loading && error && <li>Échec de la requête</li>}
          {!loading && !error && series.length === 0 && <li>Aucune série trouvée.</li>}
          {!loading && !error && series.map((serie) => (
          <Card
            key={serie.id}
            id={serie.id}
            title={serie.titre}
            coverUrl={serie.couvertureUrl}
            author={serie.auteur}
            genres={serie.genres}
            rating={serie.noteMoyenne}
            status={serie.statut}
          />
          ))}
        </ul>
      </div>

      <div className="series-pagination">
        {/* Desktop — numéros + ellipse */}
        <div className="series-pagination-desktop hidden md:flex md:justify-center mt-4 gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            aria-label="Aller à la page précédente"
            className="border border-[#999999] bg-white text-black px-2 rounded-md cursor-pointer disabled:cursor-default"
          >
            &lt;
          </button>
          {getPageNumbers().map((n, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPage(n)}
              disabled={n === '…'}
              aria-current={n === page ? 'page' : undefined}
              aria-label={
                n === '…' ? 'Pages masquées' :
                n === page ? `Page courante : ${n}` : `Aller à la page ${n}`
              }
              className={`${n === page ? 'active' : ''} border border-[#999999] bg-white text-black px-2
                rounded-md cursor-pointer`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === pagination.totalPages}
            aria-label="Aller à la page suivante"
            className={`border border-[#999999] bg-white text-black px-2 rounded-md cursor-pointer disabled:cursor-default`}
          >
            &gt;
          </button>
        </div>

        {/* Mobile — fallback statique pour le v0 */}
        <div className="series-pagination-mobile flex justify-center gap-2 md:hidden mt-4">
          <button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            aria-label="Aller à la page précédente"
            className={"px-2"}
          >
            &lt;
          </button>
          <span className="text-interactive text-body font-semibold px-2">Page {page} / {pagination.totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === pagination.totalPages}
            aria-label="Aller à la page suivante"
            className={"px-2"}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}

export default Series;