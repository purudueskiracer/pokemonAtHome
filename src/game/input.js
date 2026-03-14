// Shared mutable input state — written by DPad, read by PlayerController each frame.
// Using a plain object (not React state) so reads inside useFrame have zero overhead.
export const held = { up: false, down: false, left: false, right: false };
