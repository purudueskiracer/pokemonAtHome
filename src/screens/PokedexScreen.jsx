import { useState } from "react";
import { usePokedex } from "../hooks/usePokedex";
import PokemonDetailModal from "../components/PokemonDetailModal";
import "./PokedexScreen.css";

const SPRITE_URL = (name) =>
  `https://img.pokemondb.net/sprites/black-white/anim/normal/${name}.gif`;
const SHINY_SPRITE_URL = (name) =>
  `https://img.pokemondb.net/sprites/black-white/anim/shiny/${name}.gif`;
const FALLBACK_URL = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

const TYPE_COLORS = {
  electric: "#f4d03f", normal: "#aab0a0", flying: "#90caf9", grass: "#66bb6a",
  bug: "#aed581", fairy: "#f48fb1", fire: "#ff7043", water: "#42a5f5",
  rock: "#bcaaa4", ghost: "#ab47bc", dark: "#78909c", psychic: "#ec407a",
  ice: "#80deea", dragon: "#7e57c2", steel: "#b0bec5", poison: "#ce93d8",
  ground: "#ffcc80", fighting: "#ef9a9a",
};

/* ─── Pokédex Card (species-level) ───────────────────────────────── */
function DexCard({ pokemon, caught }) {
  const [imgError, setImgError] = useState(false);
  const typeColor = TYPE_COLORS[pokemon.type] ?? "#aaa";

  return (
    <div className={`pokedex-card ${caught ? "caught" : "unseen"}`}>
      <div className="card-number">#{String(pokemon.pokemonId).padStart(3, "0")}</div>
      {caught ? (
        <img
          src={imgError ? FALLBACK_URL(pokemon.pokemonId) : SPRITE_URL(pokemon.name)}
          alt={pokemon.name}
          className="card-sprite"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="card-silhouette">?</div>
      )}
      <div className="card-name">
        {caught ? pokemon.displayName : "???"}
      </div>
      <div className="card-type" style={{ background: caught ? typeColor : "#444", color: caught ? "#111" : "#888" }}>
        {caught ? pokemon.type : "???"}
      </div>
      {caught && <div className={`card-rarity rarity-${pokemon.rarity}`}>{pokemon.rarity}</div>}
    </div>
  );
}

/* ─── Collection Card (individual caught Pokémon) ────────────────── */
function CollectionCard({ mon, candy, megaCandy, canMega, megaActive, evo, onTransfer, onToggleFav, onMegaEvolve, onEvolve, onTap, getStarRating, starString }) {
  const [imgError, setImgError] = useState(false);
  const typeColor = TYPE_COLORS[mon.type] ?? "#aaa";
  const displayName = mon.displayName ?? mon.name;
  const spriteUrl = mon.isShiny ? SHINY_SPRITE_URL(mon.name) : SPRITE_URL(mon.name);
  const stars = mon.stars ?? (mon.ivs ? getStarRating(mon.ivs) : 0);
  const ivs = mon.ivs ?? { attack: 0, defense: 0, stamina: 0 };
  const canEvolve = evo && candy >= evo.candy;

  return (
    <div className={`collection-card${mon.isShiny ? " shiny" : ""}${stars === 4 ? " hundo" : ""}`}
         onClick={onTap}
         role="button"
         tabIndex={0}
    >
      {/* Top row: fav + variant badges */}
      <div className="col-card-top" onClick={(e) => e.stopPropagation()}>
        <button className={`fav-btn${mon.isFavorite ? " active" : ""}`} onClick={onToggleFav} title="Toggle favorite">
          {mon.isFavorite ? "❤️" : "🤍"}
        </button>
        <div className="col-badges">
          {mon.isShiny && <span className="badge-shiny" title="Shiny">✨</span>}
          {mon.variant === "alolan" && <span className="badge-region alolan">A</span>}
          {mon.variant === "galar" && <span className="badge-region galar">G</span>}
          {mon.variant === "hisuian" && <span className="badge-region hisuian">H</span>}
          {megaActive && <span className="badge-mega">M</span>}
        </div>
      </div>

      {/* Sprite */}
      <img
        src={imgError ? FALLBACK_URL(mon.pokemonId) : spriteUrl}
        alt={displayName}
        className="card-sprite"
        onError={() => setImgError(true)}
      />

      <div className="card-name">{displayName}</div>

      {/* Star rating */}
      <div className={`col-stars stars-${stars}`}>{starString(stars)}</div>

      {/* IV bar */}
      <div className="col-ivs">
        <span>A{ivs.attack}</span> <span>D{ivs.defense}</span> <span>S{ivs.stamina}</span>
      </div>

      {/* Type + rarity */}
      <div className="col-meta">
        <span className="card-type" style={{ background: typeColor, color: "#111" }}>{mon.type}</span>
        <span className={`card-rarity rarity-${mon.rarity}`}>{mon.rarity}</span>
      </div>

      {/* Candy */}
      <div className="col-candy">🍬 {candy}</div>

      {/* Actions — stopPropagation prevents opening detail modal */}
      <div className="col-actions" onClick={(e) => e.stopPropagation()}>
        {evo && (
          <button
            className={`evolve-btn${canEvolve ? " ready" : ""}`}
            onClick={onEvolve}
            disabled={!canEvolve}
            title={canEvolve ? `Evolve to ${evo.name} (${evo.candy} candy)` : `Need ${evo.candy} candy (have ${candy})`}
          >
            🔄 {evo.candy}
          </button>
        )}
        {canMega && !megaActive && (
          <button className="mega-btn" onClick={onMegaEvolve} title="Mega Evolve (uses Mega Candy)">
            ⚡ Mega
          </button>
        )}
        {!mon.isFavorite && (
          <button className="transfer-btn" onClick={onTransfer} title="Transfer for 1 candy">
            ↗ Transfer
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Confirmation Modal (replaces window.confirm/alert) ─────────── */
function ConfirmModal({ action, onConfirm, onCancel }) {
  if (!action) return null;
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-msg">{action.message}</p>
        {action.detail && <p className="confirm-detail">{action.detail}</p>}
        <div className="confirm-actions">
          <button className="confirm-yes" onClick={onConfirm}>Confirm</button>
          <button className="confirm-no" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Toast Banner (replaces window.alert for results) ───────────── */
function ActionToast({ message }) {
  if (!message) return null;
  return <div className="action-toast">{message}</div>;
}

/* ─── Main Screen ────────────────────────────────────────────────── */
export default function PokedexScreen() {
  const vm = usePokedex();
  const [selectedMon, setSelectedMon] = useState(null);

  return (
    <div className="pokedex-screen">
      {/* State-driven confirmation modal */}
      <ConfirmModal
        action={vm.pendingAction}
        onConfirm={vm.confirmAction}
        onCancel={vm.cancelAction}
      />
      <ActionToast message={vm.actionResult} />

      {/* Detail modal for selected Pokémon */}
      {selectedMon && (
        <PokemonDetailModal
          mon={selectedMon}
          starString={vm.starString}
          getStarRating={vm.getStarRating}
          onClose={() => setSelectedMon(null)}
        />
      )}

      {/* Top tabs: Pokédex / Collection */}
      <div className="top-tabs">
        <button className={`top-tab ${vm.tab === "pokedex" ? "active" : ""}`} onClick={() => vm.setTab("pokedex")}>
          📖 Pokédex
        </button>
        <button className={`top-tab ${vm.tab === "collection" ? "active" : ""}`} onClick={() => vm.setTab("collection")}>
          📦 Collection <span className="tab-count">{vm.profile.collection?.length ?? 0}</span>
        </button>
      </div>

      {/* ════════════ POKÉDEX TAB ════════════ */}
      {vm.tab === "pokedex" && (
        <>
          <div className="pokedex-header">
            <div className="pokedex-progress">
              <span>{vm.caughtCount} / {vm.totalPokemon} caught</span>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${vm.pct}%` }} />
              </div>
              <span>{vm.pct}%</span>
            </div>
          </div>

          <div className="filter-tabs">
            {["all", "caught", "unseen"].map((f) => (
              <button key={f} className={`filter-tab ${vm.dexFilter === f ? "active" : ""}`} onClick={() => vm.setDexFilter(f)}>
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="pokedex-grid">
            {vm.filteredDex.map((p) => (
              <DexCard key={p.pokemonId} pokemon={p} caught={!!vm.profile.pokedex[p.pokemonId]?.caught} />
            ))}
            {vm.filteredDex.length === 0 && (
              <p className="empty-msg">{vm.dexFilter === "caught" ? "No Pokémon caught yet — go explore!" : "All caught! Amazing!"}</p>
            )}
          </div>
        </>
      )}

      {/* ════════════ COLLECTION TAB ════════════ */}
      {vm.tab === "collection" && (
        <>
          <div className="collection-header">
            <span className="col-total">{vm.profile.collection?.length ?? 0} Pokémon</span>
            <div className="sort-tabs">
              {[
                { key: "recent", label: "Recent" },
                { key: "stars", label: "★ Best" },
                { key: "name", label: "A-Z" },
                { key: "pokemon", label: "#" },
              ].map((s) => (
                <button key={s.key} className={`sort-tab ${vm.colSort === s.key ? "active" : ""}`} onClick={() => vm.setColSort(s.key)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="collection-grid">
            {vm.sortedCollection.map((mon) => (
              <CollectionCard
                key={mon.uid}
                mon={mon}
                candy={vm.getCandy(mon.pokemonId)}
                megaCandy={vm.getMegaCandy(mon.pokemonId)}
                canMega={vm.canMega(mon.pokemonId)}
                megaActive={vm.isMegaActive(mon.pokemonId)}
                evo={vm.getEvolution(mon.pokemonId)}
                onTransfer={() => vm.requestTransfer(mon.uid)}
                onToggleFav={() => vm.toggleFavorite(mon.uid)}
                onMegaEvolve={() => vm.requestMega(mon.pokemonId)}
                onEvolve={() => vm.requestEvolve(mon.uid, mon)}
                onTap={() => setSelectedMon(mon)}
                getStarRating={vm.getStarRating}
                starString={vm.starString}
              />
            ))}
            {vm.sortedCollection.length === 0 && (
              <p className="empty-msg">No Pokémon caught yet — go explore!</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
