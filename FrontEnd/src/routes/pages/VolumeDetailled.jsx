import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import Tag from '../../components/general/Tag';
import Synopsis from '../../components/detail/Synopsis';
import Volumes from '../../components/detail/Volumes';
import Comments from '../../components/detail/Comments';

function VolumeDetailled() {
  const { id } = useParams();

  const [volume, setVolume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    axios.get(`/api/volumes/${id}`)
      .then((response) => {
        setVolume(response.data.data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <main className="volume-detail-page">Chargement...</main>;
  if (error) return <main className="volume-detail-page">Échec de la requête</main>;
  if (!volume) return null;

  const genresDiv = (
    <div className="volume-genres flex flex-col gap-2 md:mt-2">
      <span className="text-[#555555] text-sm font-medium">Genres</span>
      <div className="genres-tags flex flex-wrap gap-2 mb-2">
        {volume.genres.map((genre) => (
          <Tag key={genre} type="genre" label={genre} />
        ))}
      </div>
    </div>
  );

  const themesDiv = (
    <div className="volume-themes flex flex-col gap-2">
      <span className="text-[#555555] text-sm font-medium">Thèmes</span>
      <div className="themes-tags flex flex-wrap gap-2 mb-2">
        {volume.themes.map((theme) => (
          <Tag key={theme} type="theme" label={theme} />
        ))}
      </div>
    </div>
  );

  const titre = `${volume.titre}, Vol. ${volume.numeroVolume}`;
  const dateSortieFr = volume.dateSortie
    ? new Date(volume.dateSortie).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : 'Pas encore de date connue';

  return (
    <main className="volume-detail-page">

      {/* Bloc 1 : infos Desktop */}
      <div className="volume-infos-desktop hidden md:flex flex-col gap-8 bg-white rounded-2xl shadow-md md:p-8 md:m-12">
        <div className="volume-infos-title flex flex-col gap-1">
          <div className="volume-infos-title-header flex items-center justify-between gap-3">
            <h1 className="font-title font-bold text-3xl text-black">{titre}</h1>

            {volume.noteMoyenne != null && (
              <div className="volume-rating-container items-center gap-1 bg-star-background text-star font-body font-semibold px-3 py-1 rounded-full">
                <FontAwesomeIcon icon={faStar} className="md:w-4 md:h-4"/>
                <span className="volume-rating flex items-center gap-1">{volume.noteMoyenne}</span>
              </div>
            )}
          </div>
        </div>

        <div className="volume-infos-content flex gap-9">
          <img
            src={volume.couvertureUrl}
            alt={`Couverture ${titre}`}
            className="volume-cover w-40 md:w-50 rounded-lg shadow-sm object-cover"
          />

          <div className="volume-infos-bloc flex flex-col gap-3 font-body">
            <div className="flex gap-20 font-body border-[#999999] border-b pb-8">
              <dl className="volume-left-meta flex flex-col gap-2 text-sm pt-2">
                <div className="serie-editeur-container flex gap-4">
                  <dt className="text-[#555555] font-medium w-32 shrink-0">Éditeur</dt>
                  <dd>{volume.editeur.nom}</dd>
                </div>

                <div className="volume-parution-container flex gap-4">
                  <dt className="text-[#555555] font-medium w-32 shrink-0">Date de parution</dt>
                  <dd>{dateSortieFr}</dd>
                </div>

                <div className="volume-page-container flex gap-4">
                  <dt className="text-[#555555] font-medium w-32 shrink-0">Nombre de pages</dt>
                  <dd>{volume.nbPages}</dd>
                </div>
              </dl>


              <div className="flex flex-col gap-2 text-sm border-[#999999] border-l pl-10 pt-2 pb-4">
                <Link to={`/series/${volume.serie.id}`} className="serie-link text-interactive font-bold w-fit">← {volume.serie.titre}</Link>

                <dl className="volume-right-meta flex flex-col gap-2">
                  <div className="serie-auteur-container flex gap-4">
                    <dt className="text-[#555555] font-medium w-28 shrink-0">Auteur</dt>
                    <dd>{volume.auteurs.join(', ') || 'Auteur inconnu'}</dd>
                  </div>

                  <div className="serie-illustrateur-container flex gap-4">
                    <dt className="text-[#555555] font-medium w-28 shrink-0">Illustrateur</dt>
                    <dd>{volume.illustrateurs.join(', ') || 'Illustrateur inconnu'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {genresDiv}
            {themesDiv}
          </div>
        </div>
      </div>

      {/* infos Mobile */}
      <div className="volume-infos-mobile flex md:hidden flex-col gap-4 bg-white rounded-2xl shadow-md p-6 m-6">
        <div className="volume-infos-mobile-top flex gap-4">
          <img
            src={volume.couvertureUrl}
            alt={`Couverture ${titre}`}
            className="volume-cover w-28 aspect-2/3 rounded-lg shadow-sm object-cover shrink-0"
          />

          <div className="flex flex-col gap-1">
            <h1 className="font-title font-bold text-xl text-black">{titre}</h1>

            {volume.noteMoyenne != null && (
              <div className="serie-rating-container-mobile flex items-center gap-1 w-fit bg-star-background text-star font-body font-semibold px-2 py-0.5 rounded-full">
                <FontAwesomeIcon icon={faStar} className="w-3 h-3" />
                <span className="serie-rating-mobile">{volume.noteMoyenne}</span>
              </div>
            )}

            <Link to={`/series/${volume.serie.id}`} className="serie-link text-interactive font-bold w-fit">← {volume.serie.titre}</Link>
          </div>
        </div>

        <div className="serie-meta-mobile-container border-y border-[#999999] mt-2">
          <dl className="serie-meta-mobile flex flex-col gap-2 text-sm font-body my-4">
            <div className="volume-parution-container flex gap-4">
              <dt className="text-[#555555] font-medium w-32 shrink-0">Date de parution</dt>
              <dd>{dateSortieFr}</dd>
            </div>

            <div className="volume-page-container flex gap-4">
              <dt className="text-[#555555] font-medium w-32 shrink-0">Nombre de pages</dt>
              <dd>{volume.nbPages}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-[#555555] font-medium w-32 shrink-0">Auteur</dt>
              <dd>{volume.auteurs.join(', ') || 'Auteur inconnu'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-[#555555] font-medium w-32 shrink-0">Illustrateur</dt>
              <dd>{volume.illustrateurs.join(', ') || 'Illustrateur inconnu'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-[#555555] font-medium w-32 shrink-0">Éditeur</dt>
              <dd>{volume.editeur.nom}</dd>
            </div>
          </dl>
        </div>

        {genresDiv}

        {themesDiv}
      </div>

      {/* Bloc 2 : synopsis */}
      <Synopsis synopsis={volume.synopsis} />

      {/* Bloc 3 : volumes */}
      <Volumes volumes={volume.autresVolumes} />

      {/* Bloc 4 : commentaires — première page (10, déjà appliqué côté back par défaut) */}
      <Comments commentaires={volume.commentaires} />
    </main>
  );
}

export default VolumeDetailled;