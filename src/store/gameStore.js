import { create } from "zustand";
import { persist } from "zustand/middleware";
import { VARIANT_CATALOG, EVOLUTION_CHAINS } from "../data/worlds";
import { CANDY, MEGA, BALL_CAPS, TRAINER_PALETTE, TRAINER_DEFAULTS, TCG_CARD } from "../config/GameConfig";
import {
  rollIVs, getStarRating, starString, xpForLevel,
  trainerRank, calculateCatchXP, addXP, levelUpBalls, capBalls,
} from "../services/XPService";
import { processDailyReward } from "../services/RewardService";
import { computeEvolution, computeMegaEvolve } from "../services/PokemonService";

// ── DEBUG FLAGS ──────────────────────────────────────────────────────
const DEBUG_INFINITE_BALLS = import.meta.env.DEV;

const defaultProfile = {
  id: null,
  name: "",
  avatar: "trainer_01",
  level: 1,
  xp: 0,
  trainerRank: "Youngster",
  subjects: {
    math:    { grade: 2, adaptOn: true },
    reading: { grade: 1, adaptOn: true },
    space:   { grade: 1, adaptOn: true },
  },
  balls: {
    pokeball: 5,
    greatball: 0,
    ultraball: 0,
  },
  worldsUnlocked: ["sunlit_meadow"],
  currentWorld: "sunlit_meadow",

  // Species-level tracking (seen / caught species, for Pokédex completion)
  pokedex: {},          // { pokemonId: { caught: true, name, type, seenAt } }

  // Actual caught Pokémon instances (like Pokémon GO storage)
  collection: [],       // [ { uid, pokemonId, name, type, variant, isShiny, rarity, caughtAt, worldId, isFavorite } ]

  // Candy per Pokémon species (keyed by pokemonId)
  candy: {},            // { pokemonId: count }

  // Mega candy — separate resource, earned through a future mechanism
  megaCandy: {},        // { pokemonId: count }

  // Active mega evolutions (24h duration, keyed by pokemonId)
  megaActive: {},       // { pokemonId: expiresAt (timestamp) }

  caughtByArea: {},     // { worldId: count }
  tcgCards: [],         // [ TcgCardEntry ] — TCG card collection
  lastLoginDate: null,
  loginStreak: 0,
  // Trainer appearance — colour hex strings for each body part
  trainerColors: {
    skin:  TRAINER_PALETTE.skin[TRAINER_DEFAULTS.skin],
    shirt: TRAINER_PALETTE.shirt[TRAINER_DEFAULTS.shirt],
    pants: TRAINER_PALETTE.pants[TRAINER_DEFAULTS.pants],
    hat:   TRAINER_PALETTE.hat[TRAINER_DEFAULTS.hat],
    shoes: TRAINER_PALETTE.shoes[TRAINER_DEFAULTS.shoes],
  },
};

export const useGameStore = create(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      isSetup: false,

      // --- Profile Setup ---
      setupProfile: (name, avatar = "trainer_01") => {
        set({
          isSetup: true,
          profile: {
            ...defaultProfile,
            id: crypto.randomUUID(),
            name,
            avatar,
            lastLoginDate: new Date().toDateString(),
            loginStreak: 1,
          },
        });
      },

      // --- Trainer Appearance ---
      setTrainerColors: (colors) => {
        set((state) => ({
          profile: { ...state.profile, trainerColors: { ...state.profile.trainerColors, ...colors } },
        }));
      },

      // --- Daily Login Reward (delegates to RewardService) ---
      claimDailyReward: () => {
        const { profile } = get();
        const result = processDailyReward(profile);
        if (!result) return null;

        const { reward, streak: newStreak } = result;

        set((state) => ({
          profile: {
            ...state.profile,
            lastLoginDate: new Date().toDateString(),
            loginStreak: newStreak,
            balls: {
              pokeball:  (state.profile.balls?.pokeball ?? 0) + reward.pokeball,
              greatball: (state.profile.balls?.greatball ?? 0) + reward.greatball,
              ultraball: (state.profile.balls?.ultraball ?? 0) + reward.ultraball,
            },
          },
        }));

        return { reward, streak: newStreak };
      },

      // --- Pokéballs ---
      useBall: (ballType) => {
        if (DEBUG_INFINITE_BALLS) return true;   // ← DEBUG: skip deduction
        const { profile } = get();
        if ((profile.balls?.[ballType] ?? 0) <= 0) return false;
        set((state) => {
          const balls = state.profile.balls ?? {};
          return {
          profile: {
            ...state.profile,
            balls: {
              ...balls,
              [ballType]: (balls[ballType] ?? 0) - 1,
            },
          },
        }; });
        return true;
      },

      addBalls: (pokeball = 0, greatball = 0, ultraball = 0) => {
        set((state) => {
          const b = state.profile.balls ?? {};
          return {
          profile: {
            ...state.profile,
            balls: capBalls({
              pokeball:  (b.pokeball  ?? 0) + pokeball,
              greatball: (b.greatball ?? 0) + greatball,
              ultraball: (b.ultraball ?? 0) + ultraball,
            }),
          },
        }; });
      },

      // --- Catch a Pokémon (delegates math to services, one atomic set) ---
      catchPokemon: (pokemon, worldId) => {
        const { profile } = get();
        const isShiny = pokemon.isShiny ?? false;

        // Services do all computation
        const ivs = rollIVs(isShiny);
        const stars = getStarRating(ivs);
        const xpResult = calculateCatchXP(pokemon, profile, isShiny);
        const candyEarned = isShiny ? CANDY.onShiny : CANDY.onCatch;

        // Build collection entry
        const newEntry = {
          uid: crypto.randomUUID(),
          pokemonId: pokemon.pokemonId,
          name: pokemon.name,
          type: pokemon.type,
          variant: pokemon.variant ?? "regular",
          isShiny,
          rarity: pokemon.rarity,
          ivs,
          stars,
          caughtAt: Date.now(),
          worldId,
          isFavorite: false,
        };

        // Compute level-up balls
        const newBalls = xpResult.didLevelUp
          ? levelUpBalls(xpResult.newLevel, profile.balls)
          : profile.balls;

        // One atomic set()
        set((state) => {
          const p = state.profile;
          return {
          profile: {
            ...p,
            pokedex: {
              ...(p.pokedex ?? {}),
              [pokemon.pokemonId]: {
                caught: true,
                name: pokemon.name,
                type: pokemon.type,
                seenAt: p.pokedex?.[pokemon.pokemonId]?.seenAt ?? Date.now(),
              },
            },
            collection: [...(p.collection ?? []), newEntry],
            candy: {
              ...(p.candy ?? {}),
              [pokemon.pokemonId]: ((p.candy ?? {})[pokemon.pokemonId] ?? 0) + candyEarned,
            },
            caughtByArea: {
              ...(p.caughtByArea ?? {}),
              [worldId]: ((p.caughtByArea ?? {})[worldId] ?? 0) + 1,
            },
            xp: xpResult.remainingXp,
            level: xpResult.newLevel,
            trainerRank: trainerRank(xpResult.newLevel),
            balls: newBalls,
          },
        }; });

        return {
          xpGained: xpResult.xpGained,
          candyEarned,
          isNew: xpResult.isNew,
          didLevelUp: xpResult.didLevelUp,
          newLevel: xpResult.newLevel,
          ivs,
          stars,
        };
      },

      // --- Transfer a Pokémon to the Professor for candy ---
      transferPokemon: (uid) => {
        const { profile } = get();
        const mon = (profile.collection ?? []).find((p) => p.uid === uid);
        if (!mon) return null;
        if (mon.isFavorite) return null;

        set((state) => {
          const p = state.profile;
          return {
          profile: {
            ...p,
            collection: (p.collection ?? []).filter((c) => c.uid !== uid),
            candy: {
              ...(p.candy ?? {}),
              [mon.pokemonId]: ((p.candy ?? {})[mon.pokemonId] ?? 0) + CANDY.onTransfer,
            },
          },
        }; });

        return { pokemonId: mon.pokemonId, candyEarned: CANDY.onTransfer };
      },

      // --- Toggle favorite status ---
      toggleFavorite: (uid) => {
        set((state) => {
          const p = state.profile;
          return {
          profile: {
            ...p,
            collection: (p.collection ?? []).map((c) =>
              c.uid === uid ? { ...c, isFavorite: !c.isFavorite } : c
            ),
          },
        }; });
      },

      // --- Mega Evolve (delegates validation to PokemonService) ---
      megaEvolve: (pokemonId) => {
        const { profile } = get();
        const result = computeMegaEvolve(pokemonId, profile);
        if (!result.success) return result;

        set((state) => {
          const p = state.profile;
          return {
          profile: {
            ...p,
            megaCandy: {
              ...(p.megaCandy ?? {}),
              [pokemonId]: ((p.megaCandy ?? {})[pokemonId] ?? 0) - result.cost,
            },
            megaActive: {
              ...(p.megaActive ?? {}),
              [pokemonId]: result.expiresAt,
            },
          },
        }; });

        return result;
      },

      /** Check if a Pokémon species currently has an active mega evolution */
      isMegaActive: (pokemonId) => {
        const expires = get().profile.megaActive?.[pokemonId];
        return expires != null && expires > Date.now();
      },

      // --- Evolve a Pokémon (delegates validation to PokemonService) ---
      evolvePokemon: (uid) => {
        const { profile } = get();
        const mon = (profile.collection ?? []).find((p) => p.uid === uid);
        if (!mon) return { success: false, reason: "not_found" };

        const result = computeEvolution(mon, profile);
        if (!result.success) return result;

        const evo = EVOLUTION_CHAINS[mon.pokemonId];
        const evolvedMon = {
          ...mon,
          pokemonId: evo.evolvesTo,
          name: evo.name,
          type: evo.type,
        };

        set((state) => {
          const p = state.profile;
          return {
          profile: {
            ...p,
            candy: {
              ...(p.candy ?? {}),
              [mon.pokemonId]: ((p.candy ?? {})[mon.pokemonId] ?? 0) - evo.candy,
            },
            collection: (p.collection ?? []).map((c) =>
              c.uid === uid ? evolvedMon : c
            ),
            pokedex: {
              ...(p.pokedex ?? {}),
              [evo.evolvesTo]: {
                caught: true,
                name: evo.name,
                type: evo.type,
                seenAt: p.pokedex?.[evo.evolvesTo]?.seenAt ?? Date.now(),
              },
            },
          },
        }; });

        return result;
      },

      // --- TCG Cards ---
      addTcgCard: (card) => {
        set((state) => {
          const p = state.profile;
          const existing = p.tcgCards ?? [];
          // Trim oldest revealed cards first if at capacity;
          // fall back to oldest unrevealed if none have been revealed yet.
          let trimmed = existing;
          if (existing.length >= TCG_CARD.MAX_TCG_CARDS) {
            const revealed   = existing.filter(c =>  c.revealed).sort((a, b) => a.caughtAt - b.caughtAt);
            const unrevealed = existing.filter(c => !c.revealed);
            if (revealed.length > 0) {
              // Drop oldest revealed entry.
              trimmed = [...unrevealed, ...revealed.slice(1)];
            } else {
              // All unrevealed — drop oldest unrevealed so cap is enforced.
              const sortedUnrevealed = [...unrevealed].sort((a, b) => a.caughtAt - b.caughtAt);
              trimmed = sortedUnrevealed.slice(1);
            }
          }
          return {
            profile: { ...p, tcgCards: [...trimmed, card] },
          };
        });
      },

      flipTcgCard: (uid) => {
        set((state) => {
          const p = state.profile;
          return {
            profile: {
              ...p,
              tcgCards: (p.tcgCards ?? []).map(c =>
                c.uid === uid ? { ...c, revealed: true } : c
              ),
            },
          };
        });
      },

      // --- Get candy count for a species ---
      getCandy: (pokemonId) => get().profile.candy?.[pokemonId] ?? 0,

      // --- Add XP (delegates math to XPService) ---
      addXp: (amount) => {
        const { profile } = get();
        const result = addXP(amount, profile);

        set((state) => ({
          profile: {
            ...state.profile,
            xp: result.remainingXp,
            level: result.newLevel,
            trainerRank: trainerRank(result.newLevel),
          },
        }));

        return { didLevelUp: result.didLevelUp, newLevel: result.newLevel };
      },

      // --- World ---
      setCurrentWorld: (worldId) =>
        set((state) => ({
          profile: { ...state.profile, currentWorld: worldId },
        })),

      unlockWorld: (worldId) =>
        set((state) => {
          const unlocked = state.profile.worldsUnlocked ?? [];
          return {
            profile: {
              ...state.profile,
              worldsUnlocked: unlocked.includes(worldId)
                ? unlocked
                : [...unlocked, worldId],
            },
          };
        }),

      // --- Subject grade config ---
      setSubjectGrade: (subject, grade) =>
        set((state) => {
          const subjects = state.profile.subjects ?? {};
          return {
          profile: {
            ...state.profile,
            subjects: {
              ...subjects,
              [subject]: { ...(subjects[subject] ?? {}), grade },
            },
          },
        }; }),

      // --- Helpers ---
      getXpProgress: () => {
        const { profile } = get();
        return {
          current: profile.xp,
          needed: xpForLevel(profile.level),
          percent: Math.floor((profile.xp / xpForLevel(profile.level)) * 100),
        };
      },

      getTotalCaught: () => Object.values(get().profile.pokedex ?? {}).filter((p) => p.caught).length,

      resetProfile: () => set({ profile: defaultProfile, isSetup: false }),
    }),
    {
      name: "akademia-game-store",
      merge: (persisted, current) => {
        if (!persisted) return current;
        const pp = persisted.profile ?? {};
        const cp = current.profile;
        return {
          ...current,
          ...persisted,
          profile: {
            ...cp,
            ...pp,
            subjects:       { ...cp.subjects,       ...(pp.subjects ?? {}) },
            balls:          { ...cp.balls,          ...(pp.balls ?? {}) },
            pokedex:        { ...cp.pokedex,        ...(pp.pokedex ?? {}) },
            candy:          { ...cp.candy,          ...(pp.candy ?? {}) },
            megaCandy:      { ...cp.megaCandy,      ...(pp.megaCandy ?? {}) },
            megaActive:     { ...cp.megaActive,     ...(pp.megaActive ?? {}) },
            caughtByArea:   { ...cp.caughtByArea,   ...(pp.caughtByArea ?? {}) },
            collection:     pp.collection     ?? cp.collection,
            worldsUnlocked: pp.worldsUnlocked ?? cp.worldsUnlocked,
            tcgCards:       pp.tcgCards       ?? cp.tcgCards,
          },
        };
      },
    }
  )
);