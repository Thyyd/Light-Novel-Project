import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import Tag from './Tag';

function Card({ id, title, author, genres = [], status, rating, coverUrl }) {

  return(
    <li className="serie-card relative flex flex-row items-center bg-white w-[calc(100%-3rem)] min-w-80 max-w-108 aspect-8/5 max-h-60 mx-auto p-4 rounded-xl">
      <a
        href={`/series/${id}`}
        aria-label={`Voir la série ${title}`}
        className="absolute inset-0"
      ></a>
      <div className="serie flex flex-row items-center gap-4 h-full">
        <div className="serie-cover static md:relative h-full shrink-0">
          {rating != null && (
            <div className="serie-note absolute bottom-4 right-4 md:top-0 md:left-0 md:right-auto flex flex-row
              items-center gap-1 bg-star-background text-star px-2 py-0.5 rounded-full text-xs md:text-base"
            >
              <FontAwesomeIcon icon={faStarSolid} className='w-3 h-3 md:w-4 md:h-4' />
              <p>{rating}</p>
            </div>
          )}
          <img
            src={coverUrl || '/default_image.png'}
            onError={(e) => { e.target.src = '/default_image.png'; }}
            alt={`Cover ${title}`}
            className='serie-image h-full w-auto object-cover rounded-lg'
          />
          <Tag label={status} className="hidden md:block" />
        </div>

        <div className="serie-infos flex flex-col gap-6 h-full min-w-0 flex-1">
          <div className="serie-infos-header min-w-0 font-body">
            <h2 className="serie-title font-bold text-[1rem] truncate">{title}</h2>
            <p className="serie-author text-[#555555] font-medium text-[1rem] truncate">{author ?? 'Auteur inconnu'}</p>
          </div>

          <ul className="serie-genres flex flex-row flex-wrap gap-2">
            {genres.map((genre) => (
              <li key={genre}><Tag type="genre" label={genre} /></li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  )
}

export default Card;
