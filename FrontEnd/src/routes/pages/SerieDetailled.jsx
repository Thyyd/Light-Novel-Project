import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faBookmark } from '@fortawesome/free-regular-svg-icons';
import Tag from '../../components/general/Tag';
import Synopsis from '../../components/detail/Synopsis';
import Volumes from '../../components/detail/Volumes';
import Comments from '../../components/detail/Comments';

function SerieDetailled() {
  const { id } = useParams();
  const { user } = useAuth();

  const [serie, setSerie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    axios.get(`/api/series/${id}`)
      .then((response) => {
        setSerie(response.data.data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <main className="serie-detail-page">Chargement...</main>;
  if (error) return <main className="serie-detail-page">Échec de la requête</main>;
  if (!serie) return null;

  const titresAlternatifsAffiches = serie.titresAlternatifs.map((ta) => ta.titre).join(' / ');

  const genresDiv = (
    <div className="serie-genres flex flex-col gap-2">
      <span className="text-[#555555] text-sm font-medium">Genres</span>
      <div className="genres-tags flex flex-wrap gap-2 mb-2">
        {serie.genres.map((genre) => (
          <Tag key={genre} type="genre" label={genre} />
        ))}
      </div>
    </div>
  );

  const themesDiv = (
    <div className="serie-themes flex flex-col gap-2">
      <span className="text-[#555555] text-sm font-medium">Thèmes</span>
      <div className="themes-tags flex flex-wrap gap-2 mb-2">
        {serie.themes.map((theme) => (
          <Tag key={theme} type="theme" label={theme} />
        ))}
      </div>
    </div>
  );

  return (
    <main className="serie-detail-page">

      {/* Bloc 1 : infos Desktop */}
      <div className="serie-infos-desktop hidden md:flex flex-col gap-8 bg-white rounded-2xl shadow-md md:p-8 md:m-12">
        <div className="serie-infos-title flex flex-col gap-1">
          <div className="serie-infos-title-header flex items-center justify-between gap-3">
            <div className="serie-infos-title-header-container flex items-center gap-4">
              {user && (
                <button type="button" className="serie-bookmark text-interactive text-xl" aria-label="Ajouter aux favoris">
                  <FontAwesomeIcon icon={faBookmark} className="w-3 h-3 md:w-6 md:h-6"/>
                </button>
              )}
              <h1 className="font-title font-bold text-3xl text-black">{serie.titre}</h1>
            </div>

            {serie.noteMoyenne != null && (
              <div className="serie-rating-container hidden md:flex items-center gap-1 bg-star-background text-star font-body font-semibold px-3 py-1 rounded-full">
                <FontAwesomeIcon icon={faStar} className="md:w-4 md:h-4"/>
                <span className="serie-rating flex items-center gap-1">{serie.noteMoyenne}</span>
              </div>
            )}
          </div>

          {titresAlternatifsAffiches && (
            <p className="serie-titres-alternatifs font-body text-sm text-[#666666] italic">
              Titres alternatifs : {titresAlternatifsAffiches}
            </p>
          )}
        </div>

        <div className="serie-infos-content flex gap-9">
          <img
            src={serie.couvertureUrl}
            alt={`Couverture ${serie.titre}`}
            className="serie-cover w-40 md:w-50 rounded-lg shadow-sm object-cover"
          />

          <div className="serie-infos-bloc flex flex-col gap-3 font-body">
            {genresDiv}
            {themesDiv}

            <dl className="serie-meta flex flex-col gap-2 text-sm">
              <div className="serie-auteur-container flex gap-4">
                <dt className="text-[#555555] font-medium w-28 shrink-0">Auteur</dt>
                <dd>{serie.auteurs.join(', ') || 'Auteur inconnu'}</dd>
              </div>

              <div className="serie-illustrateur-container flex gap-4">
                <dt className="text-[#555555] font-medium w-28 shrink-0">Illustrateur</dt>
                <dd>{serie.illustrateurs.join(', ') || 'Illustrateur inconnu'}</dd>
              </div>

              <div className="serie-editeur-container flex gap-4">
                <dt className="text-[#555555] font-medium w-28 shrink-0">Éditeur</dt>
                <dd>{serie.editeur.nom}</dd>
              </div>

              <div className="serie-statut-container flex gap-4">
                <dt className="text-[#555555] font-medium w-28 shrink-0">Statut</dt>
                <dd><Tag label={serie.statut} /></dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Bloc Mobile */}
      <div className="serie-infos-mobile flex md:hidden flex-col gap-4 bg-white rounded-2xl shadow-md p-6 m-6">
        <div className="serie-infos-mobile-top flex gap-4">
          <img
            src={serie.couvertureUrl}
            alt={`Couverture ${serie.titre}`}
            className="serie-cover w-28 aspect-2/3 rounded-lg shadow-sm object-cover shrink-0"
          />

          <div className="flex flex-col gap-1">
            <div className="flex flex-row gap-1 items-center">
              {user && (
                <button type="button" className="serie-bookmark text-interactive text-lg" aria-label="Ajouter aux favoris">
                  <FontAwesomeIcon icon={faBookmark} className="w-4 h-4" />
                </button>
              )}

              <h1 className="font-title font-bold text-xl text-black">{serie.titre}</h1>
            </div>

            {titresAlternatifsAffiches && (
              <p className="serie-titres-alternatifs font-body text-sm text-[#666666] italic">
                {titresAlternatifsAffiches}
              </p>
            )}

            {serie.noteMoyenne != null && (
              <div className="serie-rating-container-mobile flex items-center gap-1 w-fit bg-star-background text-star font-body font-semibold px-2 py-0.5 rounded-full">
                <FontAwesomeIcon icon={faStar} className="w-3 h-3" />
                <span className="serie-rating-mobile">{serie.noteMoyenne}</span>
              </div>
            )}

            <Tag label={serie.statut} className="w-fit" />
          </div>
        </div>

        <div className="serie-meta-mobile-container border-y border-[#aaaaaa] mt-2">
          <dl className="serie-meta-mobile flex flex-col gap-2 text-sm font-body my-4">
            <div className="flex gap-4">
              <dt className="text-[#555555] font-medium w-28 shrink-0">Auteur</dt>
              <dd>{serie.auteurs.join(', ') || 'Auteur inconnu'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-[#555555] font-medium w-28 shrink-0">Illustrateur</dt>
              <dd>{serie.illustrateurs.join(', ') || 'Illustrateur inconnu'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-[#555555] font-medium w-28 shrink-0">Éditeur</dt>
              <dd>{serie.editeur.nom}</dd>
            </div>
          </dl>
        </div>

        {genresDiv}

        {themesDiv}
      </div>

      {/* Bloc 2 : synopsis */}
      <Synopsis synopsis={serie.synopsis} />

      {/* Bloc 3 : volumes */}
      <Volumes volumes={serie.volumes} />

      {/* Bloc 4 : commentaires — première page (10, déjà appliqué côté back par défaut) */}
      <Comments commentaires={serie.commentaires} />
    </main>
  );
}

export default SerieDetailled;