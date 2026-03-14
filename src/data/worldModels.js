/**
 * worldModels — registry mapping prop types to GLB asset paths and metadata.
 *
 * Drop the corresponding GLB files into public/models/ (see DOWNLOAD_HERE.md).
 * When files are present, GLBChunkTrees / GLBChunkDecorations will use them.
 * If a file is missing (404) the enclosing Suspense+ErrorBoundary falls back
 * to the procedural mesh equivalents automatically — no code change needed.
 *
 * Scale values normalise each model to roughly 1 world-unit = 1 metre.
 * yOffset lifts models so they sit on the flat y=0 terrain plane.
 *
 * Recommended sources (all CC0 / free for commercial use):
 *   Kenney Nature Kit  → https://kenney.nl/assets/nature-kit
 *   KayKit Forest Pack → https://kaylousberg.itch.io/kaykit-forest
 *   poly.pizza         → https://poly.pizza  (individual model downloads)
 */

/**
 * Tree model definitions.
 * Each entry maps to one GLB file and to the biome(s) where it spawns.
 * Multiple entries = multiple distinct tree species rendered in their biomes.
 */
export const TREE_MODELS = [
  {
    path:    "/models/trees/tree_pine.glb",
    biomes:  ["forest"],          // dark conifer in forested terrain
    scale:   1.0,                 // multiply the per-instance random scale
    yOffset: 0,                   // vertical shift to sit flush on terrain
  },
  {
    path:    "/models/trees/tree_oak.glb",
    biomes:  ["meadow"],          // broadleaf in open meadow terrain
    scale:   1.0,
    yOffset: 0,
  },
];

// ROCK_MODELS and BUSH_MODELS will be added here once GLBChunkDecorations
// is implemented. Do not export unused registries — they mislead future readers.
