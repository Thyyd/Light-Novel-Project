import { useRef } from 'react';

function Carousel({ children }) {
  const trackRef = useRef(null);

  function scroll(direction) {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild;
    if (!firstCard) return;

    const trackStyle = getComputedStyle(track);
    const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || 0);
    const cardWidth = firstCard.getBoundingClientRect().width + gap;

    track.scrollBy({
      left: direction === 'next' ? cardWidth : -cardWidth,
      behavior: 'smooth',
    });
  }

  return (
    <div className="carousel flex flex-row items-center gap-2">
      <button
        type="button"
        onClick={() => scroll('prev')}
        aria-label="Précédent"
        className="font-body text-[2.5rem] text-black shrink-0 px-2 cursor-pointer"
      >
        &lt;
      </button>

      <ul
        ref={trackRef}
        className="carousel-track flex flex-row gap-4 overflow-x-auto flex-1 pt-4 snap-x snap-mandatory"
      >
        {children}
      </ul>

      <button
        type="button"
        onClick={() => scroll('next')}
        aria-label="Suivant"
        className="font-body text-[2.5rem] text-black shrink-0 px-2 cursor-pointer"
      >
        &gt;
      </button>
    </div>
  );
}

export default Carousel;