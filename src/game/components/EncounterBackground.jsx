import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

const vertexShader = `
precision mediump float;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/**
 * Encounter background: real sky/ground split matching the terrain biome.
 * Sky (top 62%): zenith→horizon gradient + animated cloud noise.
 * Ground (bottom 38%): perspective terrain fill + contact shadow.
 * Horizon: soft glow strip.
 *
 * Props: skyZenith, skyHorizon, groundNear, groundFar, cloudAmt, sparkleColor
 *
 * GLSL ES 1.00 rule: NO variable declarations inside if/for bodies.
 * All locals are declared at the top of main().
 */
const fragmentShader = `
precision mediump float;
uniform float uTime;
uniform float uAspect;
uniform vec3  uSkyZenith;
uniform vec3  uSkyHorizon;
uniform vec3  uGroundNear;
uniform vec3  uGroundFar;
uniform float uCloudAmt;
varying vec2  vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
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
  // --- all locals declared up front (GLSL ES 1.00 requirement) ---
  float horizon = 0.38;
  float wx      = vUv.x * uAspect;
  float uvY     = vUv.y;

  float groundMask = 1.0 - smoothstep(horizon - 0.01, horizon + 0.025, uvY);

  // SKY
  float tSky     = clamp((uvY - horizon) / (1.0 - horizon), 0.0, 1.0);
  vec3  sky      = mix(uSkyHorizon, uSkyZenith, tSky * tSky);
  sky            = mix(sky, uSkyHorizon, exp(-tSky * 5.0) * 0.25);

  float cloudBand = smoothstep(0.10, 0.38, tSky) * (1.0 - smoothstep(0.52, 0.80, tSky));
  float cxv       = wx * 0.65 + uTime * 0.032;
  float cyv       = tSky * 1.6;
  float cn1       = vnoise(vec2(cxv * 1.7,       cyv * 2.4));
  float cn2       = vnoise(vec2(cxv * 3.6 + 1.1, cyv * 4.9 - 0.5));
  float cloud     = smoothstep(0.46, 0.70, cn1 * 0.62 + cn2 * 0.38);
  vec3  cloudCol  = mix(sky, vec3(0.82, 0.86, 0.90), 0.55);
  sky             = mix(sky, cloudCol, cloud * cloudBand * uCloudAmt);

  // GROUND
  float tGround = clamp(uvY / horizon, 0.0, 1.0);
  vec3  gnd     = mix(uGroundFar, uGroundNear, tGround * tGround);

  float gxv = wx * 4.5 + uTime * 0.028;
  float gyv = (1.0 - tGround) * 10.0;
  float gt1 = vnoise(vec2(gxv,           gyv));
  float gt2 = vnoise(vec2(gxv * 2.1 - 0.4, gyv * 2.0 - uTime * 0.022));
  gnd      *= 0.80 + (gt1 * 0.6 + gt2 * 0.4) * 0.32;

  float footY  = horizon * 0.80;
  float fsx    = (vUv.x - 0.5) * uAspect / 0.22;
  float fsy    = (uvY - footY) / 0.055;
  float fDist  = fsx * fsx + fsy * fsy;
  float shadow = 1.0 - smoothstep(0.0, 1.0, fDist);
  gnd         *= 1.0 - shadow * 0.38;
  float ring   = (1.0 - smoothstep(0.0, 0.12, abs(fDist - 0.55))) * shadow;
  gnd         += uGroundFar * ring * 0.18;

  // COMPOSITE
  float hGlow = exp(-abs(uvY - horizon) * 30.0);
  vec3  col   = mix(sky, gnd, groundMask);
  col        += uSkyHorizon * hGlow * 0.25;

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function EncounterBackground({ skyZenith, skyHorizon, groundNear, groundFar, cloudAmt, sparkleColor }) {
  const matRef = useRef();
  const { viewport } = useThree();

  const uniforms = useRef({
    uTime:       { value: 0 },
    uAspect:     { value: viewport.aspect },
    uSkyZenith:  { value: new THREE.Color(skyZenith) },
    uSkyHorizon: { value: new THREE.Color(skyHorizon) },
    uGroundNear: { value: new THREE.Color(groundNear) },
    uGroundFar:  { value: new THREE.Color(groundFar) },
    uCloudAmt:   { value: cloudAmt ?? 0.5 },
  });

  useFrame((_, delta) => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms;
    u.uTime.value         += delta;
    u.uAspect.value        = viewport.aspect;
    u.uSkyZenith.value.set(skyZenith);
    u.uSkyHorizon.value.set(skyHorizon);
    u.uGroundNear.value.set(groundNear);
    u.uGroundFar.value.set(groundFar);
    u.uCloudAmt.value      = cloudAmt ?? 0.5;
  });

  return (
    <group>
      <mesh renderOrder={-1}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms.current}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <Sparkles count={40} scale={[8, 4, 2]} position={[0, 1.8, 0]} size={2.0} speed={0.22} color={sparkleColor} opacity={0.38} />
    </group>
  );
}
