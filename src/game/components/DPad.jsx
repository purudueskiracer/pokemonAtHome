import { useEffect } from "react";
import { held } from "../input";
import "./DPad.css";

const KEY_MAP = {
  ArrowUp: "up",    KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};

/**
 * On-screen directional pad for tablet/touch play.
 * Also wires up WASD / arrow keys for keyboard play.
 * Uses pointer events so it works with both touch and mouse.
 * Pass hidden={true} during encounters to suppress all input.
 */
export default function DPad({ hidden = false }) {
  // Clear all held keys when hidden (encounter starts)
  useEffect(() => {
    if (hidden) {
      held.up = false;
      held.down = false;
      held.left = false;
      held.right = false;
    }
  }, [hidden]);

  // Keyboard support
  useEffect(() => {
    if (hidden) return;
    const dn = (e) => { if (KEY_MAP[e.code]) held[KEY_MAP[e.code]] = true; };
    const up = (e) => { if (KEY_MAP[e.code]) held[KEY_MAP[e.code]] = false; };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup",   up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup",   up);
    };
  }, [hidden]);

  if (hidden) return null;

  const press   = (dir) => (e) => { e.preventDefault(); held[dir] = true;  };
  const release = (dir) => (e) => { e.preventDefault(); held[dir] = false; };

  return (
    <div className="dpad">
      {/* Up */}
      <button
        className="dpad-btn"
        style={{ gridRow: 1, gridColumn: 2 }}
        onPointerDown={press("up")}
        onPointerUp={release("up")}
        onPointerLeave={release("up")}
        onPointerCancel={release("up")}
      >▲</button>

      {/* Left */}
      <button
        className="dpad-btn"
        style={{ gridRow: 2, gridColumn: 1 }}
        onPointerDown={press("left")}
        onPointerUp={release("left")}
        onPointerLeave={release("left")}
        onPointerCancel={release("left")}
      >◀</button>

      {/* Center (decorative) */}
      <div className="dpad-center" style={{ gridRow: 2, gridColumn: 2 }} />

      {/* Right */}
      <button
        className="dpad-btn"
        style={{ gridRow: 2, gridColumn: 3 }}
        onPointerDown={press("right")}
        onPointerUp={release("right")}
        onPointerLeave={release("right")}
        onPointerCancel={release("right")}
      >▶</button>

      {/* Down */}
      <button
        className="dpad-btn"
        style={{ gridRow: 3, gridColumn: 2 }}
        onPointerDown={press("down")}
        onPointerUp={release("down")}
        onPointerLeave={release("down")}
        onPointerCancel={release("down")}
      >▼</button>
    </div>
  );
}
