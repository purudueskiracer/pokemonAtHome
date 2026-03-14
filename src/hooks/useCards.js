/**
 * useCards — ViewModel for the Cards screen.
 *
 * Provides sorted/filtered collection data, pending-reveal list,
 * and command callbacks. No JSX, no timer side-effects.
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { fetchSetCardCount, getCachedPokemonTotal } from '../services/TCGCardService';

const RARITY_ORDER = { legendary: 0, rare: 1, uncommon: 2, common: 3 };

/** Deduplicate by cardId, accumulating quantity. */
function _dedupeByCard(cards) {
  const groups = {};
  for (const card of cards) {
    if (!groups[card.cardId]) {
      groups[card.cardId] = { ...card, quantity: 0 };
    }
    groups[card.cardId].quantity += 1;
  }
  return Object.values(groups);
}

/** Sort a card array in-place (mutates copy). */
function _sortCards(arr, sortBy) {
  if (sortBy === 'newest') {
    arr.sort((a, b) => b.caughtAt - a.caughtAt);
  } else if (sortBy === 'name') {
    arr.sort((a, b) => (a.cardName ?? '').localeCompare(b.cardName ?? ''));
  } else if (sortBy === 'rarity') {
    arr.sort((a, b) => (RARITY_ORDER[a.gameRarity] ?? 99) - (RARITY_ORDER[b.gameRarity] ?? 99));
  } else if (sortBy === 'set' || sortBy === 'pokemon') {
    // Within a set/pokémon group, sort by card number ascending.
    arr.sort((a, b) => (parseInt(a.localId, 10) || 0) - (parseInt(b.localId, 10) || 0));
  }
  return arr;
}

export function useCards() {
  const tcgCards    = useGameStore((s) => s.profile.tcgCards ?? []);
  const flipTcgCard = useGameStore((s) => s.flipTcgCard);

  const [filterRarity, setFilterRarity] = useState(null);
  const [sortBy, setSortBy]             = useState('newest');
  // setId → total official card count (loaded async from TCGdex API)
  const [setTotals, setSetTotals]       = useState({});

  // Cards the player hasn't flipped/revealed yet
  const pendingCards = useMemo(
    () => tcgCards.filter((c) => c.revealed === false),
    [tcgCards]
  );

  // Fetch set totals whenever sortBy==='set' and setIds change.
  useEffect(() => {
    if (sortBy !== 'set') return;
    const setIds = [...new Set(
      tcgCards.filter((c) => c.revealed !== false && c.setId).map((c) => c.setId)
    )];
    let cancelled = false;
    Promise.all(setIds.map((id) => fetchSetCardCount(id).then((n) => [id, n])))
      .then((results) => {
        if (cancelled) return;
        const map = {};
        for (const [id, total] of results) {
          if (total != null) map[id] = total;
        }
        setSetTotals(map);
      });
    return () => { cancelled = true; };
  }, [sortBy, tcgCards]);

  /**
   * displayGroups — the collection view model.
   *
   * Each group: { key, label, subtitle, ownedUnique, total, cards[] }
   *  - sortBy 'set'      → one group per TCG set
   *  - sortBy 'pokemon'  → one group per Pokémon species
   *  - otherwise         → single group (flat view, no label)
   *
   * `ownedUnique` = distinct cardIds held.
   * `total`       = total cards in the set/pokémon pool (null = unknown).
   */
  const displayGroups = useMemo(() => {
    const revealed = tcgCards.filter((c) => c.revealed !== false);
    const filtered = filterRarity
      ? revealed.filter((c) => c.gameRarity === filterRarity)
      : revealed;

    if (sortBy === 'set') {
      const setMap = {};
      for (const card of filtered) {
        const key = card.setId ?? 'unknown';
        if (!setMap[key]) {
          setMap[key] = {
            key,
            label: card.setName ?? key,
            subtitle: card.setYear > 0 ? String(card.setYear) : '',
            setYear: card.setYear ?? 0,
            cards: [],
          };
        }
        setMap[key].cards.push(card);
      }
      return Object.values(setMap)
        .map((g) => {
          const deduped = _dedupeByCard(g.cards);
          return {
            ...g,
            cards: _sortCards(deduped, 'set'),
            ownedUnique: deduped.length,
            total: setTotals[g.key] ?? null,
          };
        })
        .sort((a, b) => b.setYear - a.setYear || a.label.localeCompare(b.label));
    }

    if (sortBy === 'pokemon') {
      const pkMap = {};
      for (const card of filtered) {
        const key = String(card.pokemonId ?? 0);
        if (!pkMap[key]) {
          // pokemonName added in the latest buildCardEntry; fall back to card name first word.
          const name = card.pokemonName
            ?? (card.cardName?.split(' ')[0] ?? '?');
          pkMap[key] = {
            key,
            label: name.charAt(0).toUpperCase() + name.slice(1),
            subtitle: '',
            pokemonName: name,
            cards: [],
          };
        }
        pkMap[key].cards.push(card);
      }
      return Object.values(pkMap)
        .map((g) => {
          const deduped = _dedupeByCard(g.cards);
          return {
            ...g,
            cards: _sortCards(deduped, 'pokemon'),
            ownedUnique: deduped.length,
            total: getCachedPokemonTotal(g.pokemonName),
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    // Flat view — single group with no label.
    const deduped = _dedupeByCard(filtered);
    return [
      {
        key: 'all',
        label: '',
        subtitle: '',
        ownedUnique: deduped.length,
        total: null,
        cards: _sortCards(deduped, sortBy),
      },
    ];
  }, [tcgCards, filterRarity, sortBy, setTotals]);

  const pendingCount    = pendingCards.length;
  const hasPendingCards = pendingCount > 0;

  const onFilterChange = useCallback((rarity) => setFilterRarity(rarity), []);
  const onSortChange   = useCallback((sort)   => setSortBy(sort),         []);
  const onFlipCard     = useCallback((uid)    => flipTcgCard(uid),        [flipTcgCard]);

  return {
    tcgCards,
    pendingCards,
    displayGroups,
    pendingCount,
    hasPendingCards,
    filterRarity,
    sortBy,
    onFilterChange,
    onSortChange,
    onFlipCard,
  };
}

/**
 * Lightweight selector for App.jsx badge counter.
 * No local state — subscribes directly to the store.
 */
export function usePendingCardCount() {
  return useGameStore(
    (s) => (s.profile.tcgCards ?? []).filter((c) => !c.revealed).length
  );
}
