/**
 * useEncounter — ViewModel hook for the encounter flow.
 *
 * Composes: encounterReducer (FSM), useThrowPipeline (animation),
 * useBallSelection (ball cycling). Orchestrates the flow between
 * question → encounter → throwing → result phases.
 *
 * Owns: EventBus emissions, answer evaluation, throw orchestration.
 * Delegates: catch math to services, state persistence to store.
 *
 * The View (EncounterModal) receives only derived display values
 * and command handlers — no useState, no setTimeout, no business logic.
 */

import { useReducer, useCallback, useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { encounterReducer, createInitialState, ACTIONS } from "../services/encounterReducer";
import { useThrowPipeline } from "./useThrowPipeline";
import { useBallSelection } from "./useBallSelection";
import { rollCatch, rollFlee } from "../services/CatchService";
import { displayName as getDisplayName, capitalizeName } from "../services/PokemonService";
import { starString } from "../services/XPService";
import { getOneQuestion } from "../data/questions/index";
import { typeSubjectMap } from "../data/questions/index";
import { TYPE_PALETTES, BIOME_PALETTES } from "../data/worlds";
import { EventBus, EVENTS } from "../game/EventBus";

/**
 * @param {{ pokemon: import('../types').Pokemon, worldId: string }} encounter
 * @param {() => void} onClose
 */
export function useEncounter(encounter, onClose) {
  const { pokemon, worldId } = encounter;
  const profile = useGameStore((s) => s.profile);
  const useBall = useGameStore((s) => s.useBall);
  const catchPokemon = useGameStore((s) => s.catchPokemon);

  // ── Subject & question ──────────────────────────────────────────────
  const rawSubject = typeSubjectMap[pokemon.type] ?? "reading";
  // Fall back to "reading" if the mapped subject has no questions in the bank
  const subject = ["math", "reading", "space"].includes(rawSubject) ? rawSubject : "reading";
  const grade = profile.subjects[subject]?.grade ?? 1;

  // ── FSM (reducer) ───────────────────────────────────────────────────
  const [state, dispatch] = useReducer(
    encounterReducer,
    getOneQuestion({ subject, grade }),
    createInitialState
  );

  // ── Sub-hooks ───────────────────────────────────────────────────────
  const throwPipeline = useThrowPipeline();
  const ball = useBallSelection(profile.balls);

  // ── Delayed-transition timer for wrong-answer flee ──────────────────
  const fleeTimerRef = useRef(null);
  // ── Guard against double-throw race condition ──────────────────────
  const throwingRef  = useRef(false);
  const answeredRef  = useRef(false);   // stable guard for handleAnswer
  useEffect(() => () => { if (fleeTimerRef.current) clearTimeout(fleeTimerRef.current); }, []);

  // ── Derived display values (computed, not stored) ───────────────────
  const pokeName = getDisplayName(pokemon);
  const isShiny = pokemon.isShiny ?? false;
  const variant = pokemon.variant ?? "regular";
  // Prefer the terrain biome palette (matches where the player is walking);
  // fall back to the Pokémon type palette when biome is unavailable (e.g. Phaser world).
  const biome = encounter.biome;
  const typePalette = BIOME_PALETTES[biome] ?? TYPE_PALETTES[pokemon.type] ?? TYPE_PALETTES.normal;

  // Animation state for Pokemon3D
  let animState = "idle";
  if (throwPipeline.stage === "capturing"
    || throwPipeline.stage === "wobbling"
    || throwPipeline.stage === "locked") animState = "capture";
  else if (throwPipeline.stage === "burst") animState = "breakFree";
  else if (state.phase === "result" && state.catchResult === "fled") animState = "flee";

  const pokemonHidden =
    throwPipeline.stage === "wobbling" ||
    throwPipeline.stage === "locked" ||
    (state.phase === "result" && state.catchResult === "caught");



  // ── Commands ────────────────────────────────────────────────────────

  /** Handle answer selection. */
  const handleAnswer = useCallback(
    (answer) => {
      if (answeredRef.current) return;
      answeredRef.current = true;

      dispatch({ type: ACTIONS.ANSWER_SELECTED, answer }); // show selection on all paths

      if (!answer.correct) {
        const fled = rollFlee(pokemon.rarity);
        fleeTimerRef.current = setTimeout(() => {
          if (fled) {
            dispatch({ type: ACTIONS.POKEMON_FLED });
          } else {
            dispatch({ type: ACTIONS.FAILED_WRONG });
          }
        }, 1200);
        return;
      }

      // Correct → transition to encounter after brief delay (tracked for unmount cleanup)
      fleeTimerRef.current = setTimeout(() => {
        dispatch({ type: ACTIONS.ANSWER_CORRECT, answer });
      }, 600);
    },
    [pokemon.rarity]
  );

  /** Handle throw — player taps the ball. */
  const handleThrow = useCallback(() => {
    // Prevent double-throw race condition (rapid clicks before React re-renders)
    if (throwingRef.current) return;
    if (!useBall(ball.selectedBall)) return;
    throwingRef.current = true;

    const caught = rollCatch(pokemon.rarity, ball.selectedBall, 0.05);

    dispatch({ type: ACTIONS.THROW_START });

    if (caught) {
      const details = catchPokemon(pokemon, worldId);
      EventBus.emit(EVENTS.POKEMON_CAUGHT, { pokemon, worldId });
      throwPipeline.start("caught", () => {
        throwingRef.current = false;
        dispatch({ type: ACTIONS.CATCH_RESULT, details });
      });
    } else {
      const fled = rollFlee(pokemon.rarity);
      if (fled) {
        throwPipeline.start("fled", () => {
          throwingRef.current = false;
          dispatch({ type: ACTIONS.POKEMON_FLED });
        });
      } else {
        throwPipeline.start("breakFree", () => {
          throwingRef.current = false; // Allow throwing again after break-free
          answeredRef.current = false; // Allow answering the new question
          const newQ = getOneQuestion({ subject, grade });
          dispatch({ type: ACTIONS.RETRY, question: newQ });
        });
      }
    }
  }, [
    useBall, ball.selectedBall, pokemon, worldId, subject, grade,
    catchPokemon, throwPipeline.start,
  ]);

  /** Flee — player runs away. */
  const handleFlee = useCallback(() => {
    EventBus.emit(EVENTS.ENCOUNTER_RESOLVED, { caught: false });
    onClose();
  }, [onClose]);

  /** Done — dismiss result screen. */
  const handleDone = useCallback(() => {
    EventBus.emit(EVENTS.ENCOUNTER_RESOLVED, { caught: state.catchResult === "caught" });
    onClose();
  }, [state.catchResult, onClose]);

  // ── Return the ViewModel contract ───────────────────────────────────
  return {
    // FSM state
    phase:         state.phase,
    throwStage:    throwPipeline.stage,
    throwTick:     throwPipeline.tick,
    question:      state.question,
    selectedAnswer: state.selectedAnswer,
    catchResult:   state.catchResult,
    catchDetails:  state.catchDetails,

    // Ball state
    selectedBall:  ball.selectedBall,
    ballCount:     ball.ballCount,
    hasBalls:      ball.hasBalls,
    cycleBall:     ball.cycleBall,

    // Display values
    pokemon,
    pokeName,
    displayName:   pokeName,
    isShiny,
    variant,
    animState,
    pokemonHidden,
    typePalette,

    // Pre-computed display strings (keep view logic-free)
    candySpeciesName: capitalizeName(pokemon.name),
    starString,

    // Commands
    handleAnswer,
    handleThrow,
    handleFlee,
    handleDone,
  };
}
