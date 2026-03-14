# Copilot Instructions — Reading Games

## Project Overview

An educational mobile-first Pokémon-style reading/math game built with **React + Vite**, **Zustand** (persisted store), **React Three Fiber** (3D encounter screen), and **Phaser** (2D overworld map). Players roam a world map, enter quiz encounters, catch Pokémon, and progress through an XP / leveling system.

---

## Architecture

```
src/
  config/         # Pure constants — GameConfig.js is the single source of truth
  services/       # Pure functions; no React, no store access
  hooks/          # ViewModels — compose services, expose state + commands to views
  store/          # Zustand slices (gameStore.js); keep slimmer over time
  components/     # Reusable UI (EncounterModal, HUD, BottomNav, DailyRewardModal)
  screens/        # Full-screen views (GameScreen, MartScreen, PokedexScreen, etc.)
  game/           # Phaser + React Three Fiber world/scene code
  data/           # World definitions, Pokémon pools, question banks
```

### Layer Rules (MVVM)
- **Config** → imported by services only. No React.
- **Services** → pure functions. Depend on Config, not on React or the store.
- **Hooks (ViewModels)** → compose services + store. Return `vm` objects consumed by views.
- **Views (components / screens)** → receive `vm` props or call a single hook. Zero business logic.
- **Store** → state persistence only. Dispatch actions; never compute derived data inline.

---

## Key Files

| File | Role |
|---|---|
| `src/config/GameConfig.js` | All numeric constants (`ANIMATION`, `XP_CURVE`, `RARITY_RATES`, `MEGA`, `STREAK_REWARDS`, …) |
| `src/services/encounterReducer.js` | Pure FSM for encounter state transitions |
| `src/services/XPService.js` | XP/level/star calculations |
| `src/services/PokemonService.js` | Catch math, IV generation, display helpers (`capitalizeName`, `displayName`) |
| `src/services/RewardService.js` | Daily streak + reward computation |
| `src/services/CatchService.js` | Ball-throw catch-rate resolution |
| `src/hooks/useEncounter.js` | Main encounter ViewModel |
| `src/hooks/usePokedex.js` | Pokédex / collection screen ViewModel |
| `src/hooks/useMart.js` | Mart shop ViewModel |
| `src/hooks/useThrowPipeline.js` | Throw animation + catch sequencing |
| `src/store/gameStore.js` | Zustand store with persist middleware |

---

## Development

```bash
# Requires nvm — always source first in a new terminal:
source ~/.nvm/nvm.sh

npm run dev      # Vite dev server — default port 8001
npm run build    # Production build; verify 0 errors before shipping
npm run preview  # Preview prod build locally
```

- Node version: **v24** (managed via nvm)
- Store persistence key: `"akademia-game-store"`
- All state lives under the `profile` slice

---

## Using Parallel Subagents

For complex multi-step work, **launch subagents in parallel** using the `runSubagent` tool. This dramatically reduces wall-clock time for research-heavy tasks.

### When to use subagents

| Task | Strategy |
|---|---|
| Expert panel code review | Launch one subagent per expert persona simultaneously |
| Reading many files before a refactor | One subagent per file/subsystem |
| Cross-cutting research (API docs + codebase + best practices) | One subagent per source |
| Large independent refactor tasks | Split by layer (services / hooks / views) and run in parallel |
| Build verification after multiple file edits | Single subagent running the build |

### Subagent prompt template

```
You are [ROLE]. Your task is [SPECIFIC TASK].

Context:
- [Paste relevant file contents or summaries]

Your deliverable:
- [Exact output format expected]
- Return ONLY your findings — no unnecessary prose.
```

### Rules for parallel subagent use

1. **Batch independent tasks** — never wait for one research subagent before launching another unrelated one.
2. **Be specific about deliverables** — tell the subagent exactly what format to return.
3. **Deduplicate before acting** — multiple subagents may surface the same finding; read all results before writing code.
4. **Act on results yourself** — subagents do research; the orchestrator (main agent) writes the code changes.
5. **One build verification** — after all parallel edits, run a single build check to catch cross-file issues.

### Example: expert panel review

```js
// Launch all 6 expert reviews at once
const [swArch, srEng, mvvmExp, oopExp, gameDesign, threeDExp] = await Promise.all([
  runSubagent({ role: "SW Architect", focus: "scalability & coupling" }),
  runSubagent({ role: "Sr Engineer", focus: "React hooks correctness" }),
  runSubagent({ role: "MVVM Expert", focus: "layer boundary violations" }),
  runSubagent({ role: "OOP Expert", focus: "service design & encapsulation" }),
  runSubagent({ role: "Game Design Expert", focus: "balance & UX flow" }),
  runSubagent({ role: "3D/Graphics Expert", focus: "Three.js / R3F patterns" }),
]);
```

---

## Coding Conventions

- **No `window.confirm` / `window.alert`** — use state-driven confirmation modals (`pendingAction` pattern in `usePokedex`).
- **Track all `setTimeout` IDs** in a `useRef`; clear them in a `useEffect` cleanup.
- **`useCallback` dep arrays** — use stable references (e.g. `throwPipeline.start`) not composed objects.
- **True/false answer comparison** — always compare by a stable scalar (`ans.text`), never by object identity.
- **Pre-compute display strings** in the ViewModel's return value; views should not contain `.charAt(0).toUpperCase()` etc.
- **Import constants from GameConfig** — never hardcode magic numbers (e.g. use `MEGA.cost` not `200`).
- **Dead exports** — remove unused exported functions; they mislead future readers.
