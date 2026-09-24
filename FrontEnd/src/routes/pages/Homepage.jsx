import Carousel from '../../components/general/Carousel';
import Card from '../../components/general/Card';

// Mocks des volumes, car l'endpoint GET /volumes n'a pas encore été implémenté.
const derniersVolumes = [
  { id: 10, title: 'Sword Art Online Vol. 13', author: 'Reki Kawahara', genres: ['Action', 'Science-Fiction', 'Romance'], status: 'En cours', coverUrl: null },
  { id: 2, title: 'Re:Zero Vol. 16', author: 'Tappei Nagatsuki', genres: ['Isekai', 'Fantasy', 'Drama'], status: 'En cours', coverUrl: null },
  { id: 4, title: 'The Eminence in Shadow Vol. 5', author: 'Daisuke Aizawa', genres: ['Action', 'Isekai', 'Comedy'], status: 'En cours', coverUrl: null },
  { id: 1, title: 'Classroom of the Elite Vol. 5', author: 'Shogo Kinugasa', genres: ['School Life', 'Psychological', 'Drama'], status: 'En cours', coverUrl: null },
  { id: 3, title: 'Danmachi Vol. 13', author: 'Fujino Omori', genres: ['Action', 'Adventure', 'Fantasy'], status: 'En cours', coverUrl: null },
  { id: 6, title: 'The Apothecary Diaries Vol. 8', author: 'Natsu Hyuuga', genres: ['Slice of Life', 'Drama', 'Mystery'], status: 'En cours', coverUrl: null },
  { id: 12, title: 'Moi, quand je me réincarne en Slime Vol. 9', author: 'Fuse', genres: ['Isekai', 'Action', 'Fantasy'], status: 'En cours', coverUrl: null },
  { id: 5, title: '86 Vol. 6', author: 'Asato Asato', genres: ['Action', 'Science-Fiction', 'Drama'], status: 'En cours', coverUrl: null },
];

const aVenir = [
  { id: 14, title: 'Solo Leveling Vol. 4', author: 'Chugong', genres: ['Action', 'Adventure', 'Fantasy'], coverUrl: null },
  { id: 1, title: 'Classroom of the Elite Vol. 6', author: 'Shogo Kinugasa', genres: ['School Life', 'Psychological', 'Drama'], coverUrl: null },
  { id: 5, title: '86 Vol. 7', author: 'Asato Asato', genres: ['Action', 'Science-Fiction', 'Drama'], coverUrl: null },
  { id: 2, title: 'Re:Zero Vol. 17', author: 'Tappei Nagatsuki', genres: ['Isekai', 'Fantasy', 'Drama'], coverUrl: null },
  { id: 15, title: 'Konosuba Vol. 13', author: 'Natsume Akatsuki', genres: ['Comedy', 'Fantasy', 'Isekai'], coverUrl: null },
  { id: 6, title: 'The Apothecary Diaries Vol. 9', author: 'Natsu Hyuuga', genres: ['Slice of Life', 'Drama', 'Mystery'], coverUrl: null },
];

function Homepage() {
  return (
    <div className="homepage-page px-8 md:px-10 py-8">
      <div className="homepage-presentation">
        <h1 className="font-title text-4xl font-bold text-black">
          Explorez l'univers des Light Novels
        </h1>
        <p className="font-body text-base text-[#333333] mt-4 max-w-2xl">
          Romans japonais courts et illustrés, souvent adaptés en anime — découvrez le plus grand catalogue de référence du marché français.
        </p>
      </div>

      <div className="homepage-derniers-volumes mt-12">
        <div className="homepage-section-header flex flex-row items-center justify-between">
          <h2 className="font-title text-2xl font-bold text-black">Derniers volumes</h2>
          <a className="font-body text-interactive font-semibold" href="/series">Voir tout →</a>
        </div>

        <Carousel>
          {derniersVolumes.map((volume) => (
            <Card
              key={volume.id}
              id={volume.id}
              title={volume.title}
              coverUrl={volume.coverUrl}
              author={volume.author}
              genres={volume.genres}
              status={volume.status}
              rating={null}
            />
          ))}
        </Carousel>
      </div>

      <div className="homepage-a-venir mt-12">
        <h2 className="font-title text-2xl font-bold text-black">À venir</h2>
        
        <div className="carousel-a-venir max-w-275 mx-auto mb-8">
          <Carousel>
            {aVenir.map((volume) => (
              <Card
                key={volume.id}
                id={volume.id}
                title={volume.title}
                coverUrl={volume.coverUrl}
                author={volume.author}
                genres={volume.genres}
                status={volume.status}
                rating={null}
              />
            ))}
          </Carousel>
        </div>
      </div>
    </div>
  );
}

export default Homepage;