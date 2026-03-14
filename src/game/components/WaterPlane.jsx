/**
 * WaterPlane — animated translucent water surface.
 *
 * A large plane placed at y=-0.05 (just below terrain y=0) that renders
 * wherever terrain vertex colors would be "water". Uses a custom
 * ShaderMaterial with:
 *   - Two scrolling normal-like wave layers for surface motion
 *   - Depth-based opacity (darker / more opaque toward centre)
 *   - Soft reflective highlight that shifts with time
 *
 * Follows the player via a `playerRef` so it always covers the viewport.
 * Rendering order ensures it draws after terrain but before trees/decorations.
 */

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { VIEW_DISTANCE, CHUNK_SIZE } from "../terrain";
import { WORLD, WATER } from "../../config/GameConfig";

// Cover the full 5×5 chunk grid with margin — auto-updates if VIEW_DISTANCE/CHUNK_SIZE change
const WATER_SIZE = (VIEW_DISTANCE * 2 + 1) * CHUNK_SIZE * 1.5;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uDeepColor;
  uniform vec3 uFoamColor;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  // Simple 2D hash for wave patterns
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Value noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    // Two scrolling wave layers at different scales + speeds
    vec2 worldUv = vWorldPos.xz * 0.06;
    float wave1 = noise(worldUv * 1.0 + uTime * vec2(0.08, 0.06));
    // Rotate second layer ~45° to break axis-aligned banding
    vec2 rotUv = vec2(worldUv.x - worldUv.y, worldUv.x + worldUv.y) * 0.707;
    float wave2 = noise(rotUv * 2.5 - uTime * vec2(0.12, 0.04));
    float waves = (wave1 + wave2) * 0.5;

    // Blend between shallow and deep color based on wave height
    vec3 col = mix(uColor, uDeepColor, waves * 0.6);

    // Foam / highlight on wave crests
    float foam = smoothstep(0.58, 0.72, waves);
    col = mix(col, uFoamColor, foam * 0.4);

    // Subtle shimmer / specular-like highlight (clamped to prevent HDR blowout)
    float shimmer = noise(worldUv * 4.0 + uTime * vec2(0.15, -0.1));
    shimmer = pow(shimmer, 3.0) * 0.3;
    col = clamp(col + shimmer, 0.0, 1.0);

    // Edge fade — fade toward transparent at UV edges (distance from centre)
    float dist = length(vUv - 0.5) * 2.0;
    float alpha = uOpacity * (1.0 - smoothstep(0.75, 1.0, dist));

    gl_FragColor = vec4(col, alpha);
  }
`;

export default function WaterPlane({ playerRef }) {
  const meshRef = useRef();
  const matRef  = useRef();

  const uniforms = useMemo(() => ({
    uTime:      { value: 0 },
    uColor:     { value: new THREE.Color(WATER.shallowColor) },
    uDeepColor: { value: new THREE.Color(WATER.deepColor) },
    uFoamColor: { value: new THREE.Color(WATER.foamColor) },
    uOpacity:   { value: WATER.opacity },
  }), []);

  useFrame((_, delta) => {
    if (matRef.current) {
      // Wrap to prevent float32 precision loss after extended sessions
      const prev = matRef.current.uniforms.uTime.value;
      matRef.current.uniforms.uTime.value = (prev + delta) % (Math.PI * 200);
    }
    // Follow the player so water always covers the viewport
    if (meshRef.current && playerRef?.current) {
      const p = playerRef.current;
      meshRef.current.position.set(p.x, WORLD.waterY, p.z);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, WORLD.waterY, 0]} renderOrder={1}>
      <planeGeometry args={[WATER_SIZE, WATER_SIZE, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
