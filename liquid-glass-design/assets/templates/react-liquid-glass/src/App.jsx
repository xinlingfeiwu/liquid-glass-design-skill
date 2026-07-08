import { useState } from "react";
import { LiquidGlass } from "./LiquidGlass.jsx";
import "./app.css";

export default function App() {
  const [scene, setScene] = useState("aurora");
  const sceneButtons = ["aurora", "noir", "flux"];

  return (
    <main className="app-shell">
      <section className="visual-stage" data-lg-role="stage" data-scene={scene} aria-label="Liquid Glass control demo">
        <div className="scene-layers" aria-hidden="true">
          <span className="aurora-glow glow-a" />
          <span className="aurora-glow glow-b" />
          <span className="aurora-glow glow-c" />
          <div className="photo-grain" />
          <div className="contour-map" />
          <div className="signal-strips" />
          <div className="depth-card" />
        </div>

        <header className="top-strip" aria-label="Scene controls">
          {sceneButtons.map((item) => (
            <LiquidGlass
              key={item}
              as="button"
              className={`top-button ${scene === item ? "is-active" : ""}`}
              radius={999}
              profile="thin"
              strength={112}
              magnify={1.06}
              dispersion={0.014}
              adaptive
              interactive
              onClick={() => setScene(item)}
            >
              <span>{item[0].toUpperCase() + item.slice(1)}</span>
            </LiquidGlass>
          ))}
        </header>

        <section className="hero-copy" aria-hidden="true">
          <p>Liquid Glass System</p>
          <h1>Optic Deck</h1>
          <span>precision controls with calibrated edge refraction</span>
        </section>

        <LiquidGlass as="article" className="lg-panel media-card" data-lg-role="focus" radius={38} profile="prominent" strength={164} magnify={1.28} dispersion={0.052} glare={0.72}>
          <div className="media-topline">
            <span>Now Rendering</span>
            <strong>Liquid Pass 04</strong>
          </div>
          <div className="cover-art" aria-hidden="true">
            <span />
          </div>
          <div className="cover-slider" aria-hidden="true" />
          <div className="equalizer" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i />
          </div>
        </LiquidGlass>

        <section className="insight-rail" data-lg-role="rail" aria-label="Glass samples">
          <LiquidGlass as="aside" className="lg-panel status-panel" variant="tinted" radius={30} profile="soft" strength={136} magnify={1.12} dispersion={0.024} glare={0.6} adaptive>
            <p className="label">Current Layer</p>
            <strong>Refraction</strong>
            <span>96%</span>
          </LiquidGlass>
          <LiquidGlass as="article" className="lg-panel metric-card" radius={28} profile="prominent" strength={140} magnify={1.14} dispersion={0.028} glare={0.64} adaptive>
            <p className="label">Rim Depth</p>
            <strong>1.46</strong>
            <span className="sparkline" aria-hidden="true"><i /><i /><i /><i /></span>
          </LiquidGlass>
          <LiquidGlass as="article" className="lg-panel compact-card" radius={28} profile="thin" strength={126} magnify={1.08} dispersion={0.022} glare={0.6} adaptive>
            <p className="label">Glare</p>
            <strong>62%</strong>
          </LiquidGlass>
        </section>

        <LiquidGlass as="nav" className="lg-panel transport-bar" data-lg-role="dock" radius={46} profile="soft" strength={144} magnify={1.12} dispersion={0.006} glare={0.72} adaptive aria-label="Playback controls">
          <div className="track-meta">
            <div className="mini-cover" aria-hidden="true" />
            <div>
              <strong>Glass Channel</strong>
              <span>Live optical surface</span>
            </div>
          </div>

          <div className="transport-actions">
            <LiquidGlass as="button" className="lg-control-button" radius={999} profile="thin" strength={118} magnify={1.06} dispersion={0.014} adaptive interactive aria-label="Previous">
              <span>Prev</span>
            </LiquidGlass>
            <LiquidGlass as="button" className="lg-control-button play-button" radius="50%" profile="prominent" strength={148} magnify={1.16} dispersion={0.028} glare={0.78} adaptive interactive aria-label="Play">
              <span>Play</span>
            </LiquidGlass>
            <LiquidGlass as="button" className="lg-control-button" radius={999} profile="thin" strength={118} magnify={1.06} dispersion={0.014} adaptive interactive aria-label="Next">
              <span>Next</span>
            </LiquidGlass>
          </div>

          <div className="progress" aria-hidden="true"><i /></div>

          <LiquidGlass as="button" className="lg-control-button mode-button is-active" radius={999} profile="thin" strength={118} magnify={1.06} dispersion={0.014} interactive>
            <span>Clear</span>
          </LiquidGlass>
        </LiquidGlass>
      </section>
    </main>
  );
}
