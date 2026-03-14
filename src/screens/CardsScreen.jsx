/**
 * CardsScreen — View only. All logic in useCards() ViewModel.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useCards } from '../hooks/useCards';
import TCGCardReveal from '../components/TCGCardReveal';
import { resolveImageUrl } from '../services/TCGCardService';
import './CardsScreen.css';

const BATCH_SIZE = 3;

const RARITY_LABELS = {
  common:    'Common',
  uncommon:  'Uncommon',
  rare:      'Rare',
  legendary: 'Legendary',
};

const FILTER_OPTIONS = [
  { label: 'All',       value: null         },
  { label: 'Common',    value: 'common'     },
  { label: 'Uncommon',  value: 'uncommon'   },
  { label: 'Rare',      value: 'rare'       },
  { label: 'Legendary', value: 'legendary'  },
];
const SORT_OPTIONS = [
  { label: 'Newest',  value: 'newest'  },
  { label: 'Name',    value: 'name'    },
  { label: 'Rarity',  value: 'rarity'  },
  { label: 'Set',     value: 'set'     },
  { label: 'Pokémon', value: 'pokemon'  },
];

function RarityBadge({ rarity }) {
  return (
    <span className={`rarity-badge rarity-badge--${rarity?.toLowerCase()}`}>
      {RARITY_LABELS[rarity?.toLowerCase()] ?? rarity}
    </span>
  );
}

export default function CardsScreen() {
  const vm = useCards();

  // ── Batch-reveal state ─────────────────────────────────────────────
  const [batchStart, setBatchStart]   = useState(0);
  const [flippedUids, setFlippedUids] = useState(/** @type {Set<string>} */ new Set());

  // ── Detail modal state ─────────────────────────────────────────────
  const [selectedCard, setSelectedCard] = useState(null);

  // Filter / sort are owned by the ViewModel — use vm.onFilterChange / vm.onSortChange.

  // ── Auto-advance timer ref ─────────────────────────────────────────
  const advanceTimerRef = useRef(null);

  // Reset batch when pendingCards changes (new cards arrive)
  useEffect(() => {
    setBatchStart(0);
    setFlippedUids(new Set());
  }, [vm.pendingCards.length]);

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  // Current batch of pending cards to reveal
  const currentBatch = vm.pendingCards.slice(batchStart, batchStart + BATCH_SIZE);

  // All cards in current batch have been flipped
  const batchFullyFlipped =
    currentBatch.length > 0 &&
    currentBatch.every(card => flippedUids.has(card.uid));

  // Auto-advance to next batch after delay once fully flipped
  useEffect(() => {
    if (!batchFullyFlipped) return;
    advanceTimerRef.current = setTimeout(() => {
      const nextStart = batchStart + BATCH_SIZE;
      if (nextStart < vm.pendingCards.length) {
        setBatchStart(nextStart);
        setFlippedUids(new Set());
      }
    }, 800);
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [batchFullyFlipped, batchStart, vm.pendingCards.length]);

  // ── Card-tap handler: decode image then flip ──────────────────────
  const handleCardTap = useCallback((card) => {
    if (flippedUids.has(card.uid)) return; // already flipped

    const imgEl = document.getElementById(`card-front-${card.uid}`);
    const flip = () =>
      setFlippedUids(prev => {
        const next = new Set(prev);
        next.add(card.uid);
        return next;
      });

    if (imgEl) {
      imgEl.decode().then(flip).catch(flip);
    } else {
      flip();
    }
  }, [flippedUids]);

  // ── Persist reveal when animation finishes ────────────────────────
  const handleFlipped = useCallback((card) => {
    vm.onFlipCard(card.uid);
  }, [vm.onFlipCard]);  // stable ref — not the whole vm object

  // ── Collection view model ──────────────────────────────────────────
  const hasRevealedCards = vm.displayGroups.some((g) => g.cards.length > 0);
  const isEmpty = !vm.hasPendingCards && !hasRevealedCards;

  // ── Manual "Open next batch" button ──────────────────────────────
  const handleOpenNext = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    const nextStart = batchStart + BATCH_SIZE;
    if (nextStart < vm.pendingCards.length) {
      setBatchStart(nextStart);
      setFlippedUids(new Set());
    }
  };

  return (
    <div className="cards-screen">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="cards-header">
        <h1 className="cards-title">🃏 My Cards</h1>
        {vm.hasPendingCards && (
          <span className="pending-count-badge">
            {vm.pendingCards.length} to open
          </span>
        )}
      </div>

      {/* ── Pending reveal strip ────────────────────────────────── */}
      {vm.hasPendingCards && (
        <section className="pending-section">
          <p className="pending-label">Tap a card to reveal it!</p>
          <div className="pending-strip">
            {currentBatch.map(card => (
              <TCGCardReveal
                key={card.uid}
                card={card}
                isFlipped={flippedUids.has(card.uid)}
                onTap={() => handleCardTap(card)}
                onFlipped={() => handleFlipped(card)}
                frontImageId={`card-front-${card.uid}`}
                frontSrc={resolveImageUrl(card.imageKey, 'low')}
              />
            ))}
          </div>

          {/* "Open next" manual button — visible while auto-advance hasn't fired */}
          {batchFullyFlipped && batchStart + BATCH_SIZE < vm.pendingCards.length && (
            <button className="open-next-btn" onClick={handleOpenNext}>
              Open next →
            </button>
          )}
        </section>
      )}

      {/* ── Empty state ─────────────────────────────────────────── */}
      {isEmpty && (
        <div className="cards-empty">
          <p className="cards-empty-icon">🃏</p>
          <p className="cards-empty-title">No cards yet</p>
          <p className="cards-empty-subtitle">Catch Pokémon to earn cards!</p>
        </div>
      )}

      {/* ── Collection ──────────────────────────────────────────── */}
      {!isEmpty && (
        <section className="collection-section">
          {/* Filter pills */}
          <div className="filter-row" role="group" aria-label="Filter by rarity">
            {FILTER_OPTIONS.map(({ label, value }) => (
              <button
                key={label}
                className={`filter-pill${vm.filterRarity === value ? ' active' : ''}`}
                onClick={() => vm.onFilterChange(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort buttons */}
          <div className="sort-row" role="group" aria-label="Sort cards">
            {SORT_OPTIONS.map(({ label, value }) => (
              <button
                key={label}
                className={`sort-btn${vm.sortBy === value ? ' active' : ''}`}
                onClick={() => vm.onSortChange(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Grid — flat or grouped by set/pokémon */}
          {hasRevealedCards ? (
            vm.displayGroups.map((group) => (
              <div key={group.key} className="set-group">
                {group.label && (
                  <div className="set-group-header">
                    <div className="set-group-title-row">
                      <span className="set-group-name">{group.label}</span>
                      {group.subtitle && (
                        <span className="set-group-year">{group.subtitle}</span>
                      )}
                    </div>
                    <div className="set-group-progress">
                      <span className="set-group-fraction">
                        {group.ownedUnique}
                        {group.total != null && (
                          <span className="set-group-total"> / {group.total}</span>
                        )}
                      </span>
                      {group.total != null && (
                        <div className="set-group-bar" role="progressbar"
                          aria-valuenow={group.ownedUnique}
                          aria-valuemax={group.total}
                        >
                          <div
                            className="set-group-bar-fill"
                            style={{ width: `${Math.min(100, group.ownedUnique / group.total * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="collection-grid">
                  {group.cards.map((card) => (
                    <button
                      key={card.uid}
                      className="card-tile"
                      onClick={() => setSelectedCard(card)}
                      aria-label={`View ${card.cardName}`}
                    >
                      <picture>
                        <source
                          srcSet={resolveImageUrl(card.imageKey, 'low', 'webp')}
                          type="image/webp"
                        />
                        <img
                          src={resolveImageUrl(card.imageKey, 'low', 'jpg')}
                          alt={card.cardName}
                          loading="lazy"
                        />
                      </picture>
                      <RarityBadge rarity={card.gameRarity} />
                      {card.quantity > 1 && (
                        <span className="quantity-badge">×{card.quantity}</span>
                      )}
                      <span className="card-tile-name">{card.cardName}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="no-results-text">No cards match this filter.</p>
          )}
        </section>
      )}

      {/* ── Detail modal ────────────────────────────────────────── */}
      {selectedCard && (
        <div
          className="card-detail-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedCard.cardName} details`}
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="card-detail"
            onClick={e => e.stopPropagation()}
          >
            <picture>
              <source
                srcSet={resolveImageUrl(selectedCard.imageKey, 'high', 'webp')}
                type="image/webp"
              />
              <img
                src={resolveImageUrl(selectedCard.imageKey, 'high', 'jpg')}
                alt={selectedCard.cardName}
                className="card-detail-img"
              />
            </picture>
            <div className="card-detail-info">
              <h2 className="card-detail-name">{selectedCard.cardName}</h2>
              {selectedCard.setName && (
                <p className="card-detail-set">
                  {selectedCard.setName}{selectedCard.setYear ? ` (${selectedCard.setYear})` : ''}
                </p>
              )}
              <RarityBadge rarity={selectedCard.gameRarity} />
            </div>
            <button
              className="card-detail-close"
              onClick={() => setSelectedCard(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
