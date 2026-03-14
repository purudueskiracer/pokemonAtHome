# World Model Assets — Download Instructions

Place GLB files in the directories below, then restart the dev server.
The game falls back to procedural meshes automatically if any file is missing,
so you can add models incrementally.

---

## Required directory structure

```
public/
  models/
    trees/
      tree_pine.glb     ← conifer (spawns in forest biome)
      tree_oak.glb      ← broadleaf (spawns in meadow biome)
    props/
      rock_large.glb    ← boulder decoration
      bush.glb          ← foliage decoration
```

---

## Recommended free sources (all CC0 — no attribution required)

### Option A — Kenney Nature Kit ⭐ (best style match)

330 low-poly props, GLB + FBX + OBJ included.

1. Go to https://kenney.nl/assets/nature-kit
2. Click **Download** (free, no account needed)
3. Unzip → open the `Models/GLTF format/` folder
4. Copy the relevant files and rename:

| Kenney file | → Place as |
|---|---|
| `tree_pinetall.glb` | `public/models/trees/tree_pine.glb` |
| `tree_default.glb`  | `public/models/trees/tree_oak.glb`  |
| `rock.glb`          | `public/models/props/rock_large.glb` |
| `bush.glb`          | `public/models/props/bush.glb`       |

---

### Option B — KayKit Forest Pack (rounder / more organic)

100+ models, GLTF included, CC0.

1. Go to https://kaylousberg.itch.io/kaykit-forest
2. Click **Download Now** → enter $0 or any amount
3. Unzip → `GLTF/` folder
4. Rename and copy as above (KayKit uses similar naming)

---

### Option C — poly.pizza (individual model downloads, CC0, direct GLB)

Browse https://poly.pizza and download individual models:

| Category | Search term | Suggested model |
|---|---|---|
| Pine tree | `pine tree low poly` | Quaternius pine — https://poly.pizza/m/oYtDty0fR6 |
| Oak tree  | `oak tree low poly`  | Quaternius maple — https://poly.pizza/m/iGFtQd0PJO |
| Rock       | `rock low poly`      | Quaternius rock — https://poly.pizza/m/54jZKTAt5p |
| Bush       | `bush low poly`      | Quaternius bush — https://poly.pizza/m/J2h3HrO356 |

Each model page has a **Download** button that gives you a `.glb` file directly.

---

## Adjusting scale / position

If a model floats above or sinks into the terrain, edit `src/data/worldModels.js`:

```js
export const TREE_MODELS = [
  {
    path:    "/models/trees/tree_pine.glb",
    biomes:  ["forest"],
    scale:   1.0,    // ← increase/decrease to resize
    yOffset: 0,      // ← positive = lift up, negative = sink in
  },
```

Changes take effect immediately in the dev server (hot reload).

---

## Optional — Pokéball GLB model upgrades

The encounter screen renders **procedural geometry** Pokéballs (no download needed).
For a higher-detail GLB, drop a file into `public/models/pokeballs/` and load with `useGLTF` in `Pokeball3D.jsx`.

### Free GLB Pokéball sources

| Source | License | Notes |
|---|---|---|
| [poly.pizza "pokeball" — Jose Ramos](https://poly.pizza/m/aBDajZAsuFE) | CC0 | Low-poly, single mesh |
| [poly.pizza "pokeball" — Exceptional_3D](https://poly.pizza/m/m8zAwR6eBA) | CC0 | 4-part mesh with good seam detail |
| [Sketchfab CC0 filter](https://sketchfab.com/search?q=pokeball&type=models&features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b) | CC0 | Always verify license before use |

### Recommended directory structure

```
public/models/pokeballs/
  pokeball.glb
  greatball.glb
  ultraball.glb
  masterball.glb
```
