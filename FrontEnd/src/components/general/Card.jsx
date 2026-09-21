import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import Tag from './Tag';

function Card({ id, title, author, genres = [], status, rating, coverUrl }) {

  return(
    <li className="serie-card snap-start relative flex flex-row md:flex-col items-center md:items-stretch bg-white
      w-[calc(100%-3rem)] min-w-80 max-w-108 aspect-8/5 max-h-60 mx-auto md:w-80 md:shrink-0 md:aspect-auto md:max-h-none
      md:mx-0 p-4 mt-4 overflow-hidden rounded-xl"
    >
      <a
        href={`/series/${id}`}
        aria-label={`Voir la série ${title}`}
        className="absolute inset-0 z-10"
      ></a>
      <div className="serie flex flex-row md:flex-col items-center md:items-stretch md:gap-0 gap-4 h-full md:h-auto">
        <div className="serie-cover static md:relative h-full md:h-50 md:w-full shrink-0">
          {rating != null && (
            <div className="serie-note absolute bottom-4 right-4 md:top-2 md:right-2 flex flex-row
              items-center gap-1 bg-star-background text-star px-2 py-0.5 rounded-full text-xs md:text-base md:max-h-fit"
            >
              <FontAwesomeIcon icon={faStarSolid} className='w-3 h-3 md:w-4 md:h-4' />
              <p>{rating}</p>
            </div>
          )}
          <img
            src={coverUrl || '/default_image.png'}
            onError={(e) => { e.target.src = '/default_image.png'; }}
            alt={`Cover ${title}`}
            className='serie-image h-full w-auto object-cover object-top rounded-lg md:w-full'
          />
          {status != null && (
            <Tag label={status} className="hidden md:block md:absolute md:bottom-2 md:left-2" />
          )}
        </div>

        <div className="serie-infos flex flex-col gap-6 h-full min-w-0 flex-1 md:text-center">
          <div className="serie-infos-header min-w-0 font-body">
            <h2 className="serie-title font-bold text-[1rem] truncate">{title}</h2>
            <p className="serie-author text-[#555555] font-medium text-[1rem] truncate">{author?.trim() || 'Auteur inconnu'}</p>
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
