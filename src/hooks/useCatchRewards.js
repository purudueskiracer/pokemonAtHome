/**
 * useCatchRewards — listens for POKEMON_CAUGHT events and asynchronously
 * fetches a TCG card, rolls it, and persists it to the store.
 *
 * Decoupled from useEncounter intentionally — card logic is a side-effect
 * of catching, not part of the encounter FSM.
 *
 * Mount this once at the app root (App.jsx) so the listener is active
 * regardless of which tab is visible — before the isSetup guard.
 */
import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { EventBus, EVENTS } from '../game/EventBus';
import { fetchCardsForPokemon, fetchFullCard, filterByVariant, mapRawCard, rollCard, buildCardEntry } from '../services/TCGCardService';

export function useCatchRewards() {
  const addTcgCard = useGameStore((s) => s.addTcgCard);
  const mountedRef = useRef(true);
  const abortRef   = useRef(null);

  useEffect(() => {
    mountedRef.current = true;

    async function handleCaught({ pokemon, worldId }) {
      // New controller per catch — NOT aborting previous
      // (fast Done taps must not cancel an in-flight card fetch)
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const cards    = await fetchCardsForPokemon(pokemon, { signal: controller.signal });
        const variants = filterByVariant(cards, pokemon).map(mapRawCard); // map before roll so weights work
        const rolled   = rollCard(variants);
        if (!rolled) return;
        // Enrich with full card data (set name, release date, rarity, variants)
        // so that set-mode grouping and foil display work correctly.
        const fullCard = await fetchFullCard(rolled.id, { signal: controller.signal });
        const entry    = buildCardEntry(fullCard ?? rolled, pokemon, worldId);
        if (!entry) return;
        if (mountedRef.current) {
          addTcgCard(entry);
          EventBus.emit(EVENTS.CARD_EARNED, { card: entry, pokemon });
        }
      } catch {
        /* silent — network errors must never crash the game */
      }
    }

    EventBus.on(EVENTS.POKEMON_CAUGHT, handleCaught);
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort(); // abort only on unmount
      EventBus.off(EVENTS.POKEMON_CAUGHT, handleCaught);
    };
  }, [addTcgCard]);
}
