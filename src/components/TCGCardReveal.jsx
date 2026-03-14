/**
 * TCGCardReveal — a single card that starts face-down and flips to reveal
 * when the player taps it.
 *
 * Props:
 *   card         - TcgCardEntry
 *   isFlipped    - controlled boolean (parent owns flip state)
 *   onTap        - called when the user taps a face-down card
 *   onFlipped    - called after the flip animation completes
 *   frontSrc     - URL for the card front image (low-res for reveal)
 *   frontImageId - id attribute to set on the <img> for decode() access
 */
import { useRef } from 'react';
import './TCGCardReveal.css';

export default function TCGCardReveal({
  card,
  isFlipped,
  onTap,
  onFlipped,
  frontSrc,
  frontImageId,
}) {
  const innerRef = useRef(null);

  function handleTransitionEnd(e) {
    // Only fire once per flip (there may be multiple transitioned properties)
    if (e.propertyName !== 'transform') return;
    if (innerRef.current) innerRef.current.style.willChange = '';
    onFlipped?.();
  }

  function handleClick() {
    if (isFlipped) return;
    if (innerRef.current) innerRef.current.style.willChange = 'transform';
    onTap?.();
  }

  const foilClass =
    card.foilType === 'holo'        ? 'tcg-foil-holo'
    : card.foilType === 'reverseHolo' ? 'tcg-foil-reverse'
    : '';

  return (
    <div
      className="tcg-card-container"
      onClick={handleClick}
      role="button"
      aria-label={isFlipped ? card.cardName : 'Tap to reveal card'}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      <div
        ref={innerRef}
        className={`tcg-card-inner${isFlipped ? ' tcg-card-inner--flipped' : ''}`}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Front face — card art */}
        <div className={`tcg-card-face tcg-card-face--front${foilClass ? ` ${foilClass}` : ''}`}>
          <picture>
            <source srcSet={frontSrc} type="image/webp" />
            <img
              id={frontImageId}
              src={frontSrc?.replace('.webp', '.jpg')}
              alt={card.cardName}
              loading="eager"
              className="tcg-card-img"
            />
          </picture>
        </div>

        {/* Back face — standard card back */}
        <div className="tcg-card-face tcg-card-face--back" aria-hidden="true">
          <div className="tcg-card-back-design" />
        </div>
      </div>
    </div>
  );
}
