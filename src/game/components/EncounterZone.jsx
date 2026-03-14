import React, { useRef, useState } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { getRandomEncounter } from "../../data/worlds";

const ENCOUNTER_CHANCE = 0.15; // 15% chance each time player enters the zone
const COOLDOWN_MS      = 4000; // ms before same zone can fire again

/**
 * An invisible sensor zone that triggers a Pokémon encounter when the
 * player walks into it. Uses Rapier sensor collider — zero physics cost.
 */
export default function EncounterZone({ position, biome, worldId, onEncounter }) {
  const lastFired = useRef(0);
  const [visible, setVisible] = useState(false); // debug: set true to see zones

  function handleEnter() {
    const now = Date.now();
    if (now - lastFired.current < COOLDOWN_MS) return;
    if (Math.random() > ENCOUNTER_CHANCE) return;

    lastFired.current = now;
    const pokemon = getRandomEncounter(worldId);
    if (pokemon) onEncounter({ pokemon, worldId });
  }

  return (
    <RigidBody type="fixed" sensor onIntersectionEnter={handleEnter} position={position}>
      <CuboidCollider args={[3, 2, 3]} />
      {visible && (
        <mesh>
          <boxGeometry args={[6, 4, 6]} />
          <meshBasicMaterial color="lime" transparent opacity={0.2} wireframe />
        </mesh>
      )}
    </RigidBody>
  );
}
