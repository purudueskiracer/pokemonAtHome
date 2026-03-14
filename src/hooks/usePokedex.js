/**
 * usePokedex — ViewModel hook for the Pokédex / Collection screen.
 *
 * Owns: tab state, sort/filter, transfer/evolve/mega confirmation flow.
 * Replaces window.confirm/alert with state-driven pending actions.
 *
 * The View renders a confirmation modal based on `pendingAction` state
 * instead of blocking browser dialogs.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { MEGA } from "../config/GameConfig";
import { EVOLUTION_CHAINS, VARIANT_CATALOG, worlds } from "../data/worlds";
import { getStarRating, starString } from "../services/XPService";
import * as PokemonService from "../services/PokemonService";

// ── Derived data: all Pokémon across all worlds (computed once) ──────
const ALL_POKEMON = Object.values(
  worlds.flatMap((w) => w.pokemonPool).reduce((acc, p) => {
    acc[p.pokemonId] = p;
    return acc;
  }, {})
);

/**
 * @typedef {Object} PendingAction
 * @property {'transfer'|'evolve'|'mega'|'reset'} type
 * @property {string} [uid]
 * @property {Object} [mon]
 * @property {string} message
 * @property {string} [detail]
 */

/**
 * @returns {{
 *   tab: string, setTab: (t: string) => void,
 *   dexFilter: string, setDexFilter: (f: string) => void,
 *   colSort: string, setColSort: (s: string) => void,
 *   filteredDex: Array, sortedCollection: Array,
 *   totalPokemon: number, caughtCount: number, pct: number,
 *   profile: Object,
 *   pendingAction: PendingAction|null,
 *   confirmAction: () => void, cancelAction: () => void,
 *   actionResult: string|null,
 *   requestTransfer: (uid: string) => void,
 *   requestEvolve: (uid: string, mon: Object) => void,
 *   requestMega: (pokemonId: number) => void,
 *   toggleFavorite: (uid: string) => void,
 *   isMegaActive: (pokemonId: number) => boolean,
 *   getCandy: (pokemonId: number) => number,
 *   getMegaCandy: (pokemonId: number) => number,
 *   canMega: (pokemonId: number) => boolean,
 *   getEvolution: (pokemonId: number) => Object|null,
 *   getStarRating, starString,
 * }}
 */
export function usePokedex() {
  const profile = useGameStore((s) => s.profile);
  const transferPokemon = useGameStore((s) => s.transferPokemon);
  const toggleFavStore = useGameStore((s) => s.toggleFavorite);
  const megaEvolveStore = useGameStore((s) => s.megaEvolve);
  const evolvePokemonStore = useGameStore((s) => s.evolvePokemon);

  // ── Tab / filter / sort state ─────────────────────────────────────
  const [tab, setTab] = useState("pokedex");
  const [dexFilter, setDexFilter] = useState("all");
  const [colSort, setColSort] = useState("recent");

  // ── Confirmation flow (replaces window.confirm/alert) ─────────────
  const [pendingAction, setPendingAction] = useState(null);
  const [actionResult, setActionResult] = useState(null);

  // ── Toast timer — cleaned up on unmount ───────────────────────────
  const toastTimerRef = useRef(null);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  /** Show a timed toast message, cancelling any previous one. */
  const showToast = useCallback((msg, durationMs = 3500) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setActionResult(msg);
    toastTimerRef.current = setTimeout(() => setActionResult(null), durationMs);
  }, []);

  // ── Pokédex stats ─────────────────────────────────────────────────
  const totalPokemon = ALL_POKEMON.length;
  const caughtCount = Object.values(profile.pokedex).filter((p) => p.caught).length;
  const pct = totalPokemon > 0 ? Math.floor((caughtCount / totalPokemon) * 100) : 0;

  const filteredDex = useMemo(() => {
    return ALL_POKEMON.filter((p) => {
      const caught = !!profile.pokedex[p.pokemonId]?.caught;
      if (dexFilter === "caught") return caught;
      if (dexFilter === "unseen") return !caught;
      return true;
    }).map((p) => ({
      ...p,
      displayName: PokemonService.capitalizeName(p.name),
    }));
  }, [profile.pokedex, dexFilter]);

  const sortedCollection = useMemo(() => {
    return [...(profile.collection ?? [])].sort((a, b) => {
      if (colSort === "recent") return b.caughtAt - a.caughtAt;
      if (colSort === "stars") return (b.stars ?? 0) - (a.stars ?? 0) || a.pokemonId - b.pokemonId;
      if (colSort === "name") return a.name.localeCompare(b.name);
      if (colSort === "pokemon") return a.pokemonId - b.pokemonId;
      return 0;
    }).map((mon) => ({
      ...mon,
      displayName: PokemonService.capitalizeName(mon.name),
    }));
  }, [profile.collection, colSort]);

  // ── Action requests (open confirmation) ───────────────────────────

  const requestTransfer = useCallback((uid) => {
    setPendingAction({
      type: "transfer",
      uid,
      message: "Transfer this Pokémon to the Professor for 1 candy?",
    });
  }, []);

  const requestEvolve = useCallback((uid, mon) => {
    const evo = EVOLUTION_CHAINS[mon.pokemonId];
    if (!evo) return;
    const candy = profile.candy[mon.pokemonId] ?? 0;

    if (candy < evo.candy) {
      showToast(`Need ${evo.candy} candy to evolve (you have ${candy}).`);
      return;
    }
    const evoName = PokemonService.capitalizeName(evo.name);
    const monName = PokemonService.capitalizeName(mon.name);
    setPendingAction({
      type: "evolve",
      uid,
      mon,
      message: `Evolve ${monName} into ${evoName} for ${evo.candy} candy?`,
    });
  }, [profile.candy, showToast]);

  const requestMega = useCallback((pokemonId) => {
    const megaCandy = profile.megaCandy?.[pokemonId] ?? 0;
    if (megaCandy < MEGA.cost) {
      showToast(`Need ${MEGA.cost} Mega Candy to Mega Evolve (you have ${megaCandy}). Earn Mega Candy through special activities!`, 4000);
      return;
    }
    setPendingAction({
      type: "mega",
      pokemonId,
      message: `Use ${MEGA.cost} Mega Candy to activate 24h Mega Evolution?`,
    });
  }, [profile.megaCandy, showToast]);

  // ── Confirm / cancel ──────────────────────────────────────────────

  const confirmAction = useCallback(() => {
    if (!pendingAction) return;
    const { type, uid, mon, pokemonId } = pendingAction;

    if (type === "transfer") {
      transferPokemon(uid);
    } else if (type === "evolve") {
      const result = evolvePokemonStore(uid);
      if (result?.success && result.isNewDex) {
        const evoName = PokemonService.capitalizeName(result.evolvedName);
        showToast(`🆕 ${evoName} registered in the Pokédex!`);
      }
    } else if (type === "mega") {
      megaEvolveStore(pokemonId);
    }

    setPendingAction(null);
  }, [pendingAction, transferPokemon, evolvePokemonStore, megaEvolveStore, showToast]);

  const cancelAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────

  const toggleFavorite = useCallback(
    (uid) => toggleFavStore(uid),
    [toggleFavStore]
  );

  const isMegaActive = useCallback(
    (pokemonId) => PokemonService.isMegaActive(pokemonId, profile.megaActive),
    [profile.megaActive]
  );

  const getCandy = useCallback(
    (pokemonId) => profile.candy[pokemonId] ?? 0,
    [profile.candy]
  );

  const getMegaCandy = useCallback(
    (pokemonId) => profile.megaCandy?.[pokemonId] ?? 0,
    [profile.megaCandy]
  );

  return {
    tab, setTab,
    dexFilter, setDexFilter,
    colSort, setColSort,
    filteredDex, sortedCollection,
    totalPokemon, caughtCount, pct,
    profile,
    pendingAction, confirmAction, cancelAction,
    actionResult,
    requestTransfer, requestEvolve, requestMega,
    toggleFavorite,
    isMegaActive,
    getCandy, getMegaCandy,
    canMega: PokemonService.canMega,
    getEvolution: PokemonService.getEvolution,
    getStarRating, starString,
  };
}
