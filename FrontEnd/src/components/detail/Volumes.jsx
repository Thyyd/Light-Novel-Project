import { Link } from 'react-router-dom';


function Volumes({ volumes }) {
  { /* flex-wrap (pas de grid), 3 par ligne mobile / 8 par ligne desktop */}
  return(
    <div className="volumes flex flex-col gap-4 bg-white rounded-2xl shadow-md p-6 m-6 md:p-8 md:m-12">
      <h2 className="font-title font-bold text-2xl text-black">Volumes</h2>
      <ul className="volumes-list flex flex-wrap gap-6 md:gap-10 w-full px-6">
        {volumes.map((volume) => (
          <li key={volume.id} className="volume flex flex-col items-center gap-1 w-[calc((100%-2*1.5rem)/3)] md:w-[calc((100%-7*2.5rem)/8)]">
            <Link to={`/volumes/${volume.id}`} className="block w-full">
              <img
                src={volume.couvertureUrl}
                alt={`Couverture Volume ${volume.numeroVolume}`}
                className="w-full aspect-2/3 rounded-lg shadow-sm object-cover"
              />
            </Link>
            <span className="font-body text-sm text-black">Vol. {volume.numeroVolume}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Volumes;
