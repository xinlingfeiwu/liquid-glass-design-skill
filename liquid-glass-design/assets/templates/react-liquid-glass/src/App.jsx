import { useState } from "react";
import { LiquidGlass } from "./LiquidGlass.jsx";
import "./app.css";

export default function App() {
  const [scene, setScene] = useState("aurora");
  const sceneButtons = ["aurora", "noir", "flux"];

  return (
    <main className="app-shell">
      <section className="visual-stage" data-scene={scene} aria-label="Liquid Glass control demo">
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
              strength={126}
              magnify={1.14}
              interactive
              onClick={() => setScene(item)}
            >
              <span>{item[0].toUpperCase() + item.slice(1)}</span>
            </LiquidGlass>
          ))}
        </header>

        <section className="hero-copy" aria-hidden="true">
          <p>Liquid Glass Skill</p>
          <h1>Optic Deck</h1>
          <span>control surfaces with real edge refraction</span>
        </section>

        <LiquidGlass as="article" className="lg-panel media-card" radius={38} profile="prominent" strength={168} magnify={1.32} dispersion={0.08} glare={0.72}>
          <div className="media-topline">
            <span>Now Rendering</span>
            <strong>Liquid Pass 04</strong>
          </div>
          <div className="cover-art" aria-hidden="true">
            <span />
            <i />
          </div>
          <div className="equalizer" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i />
          </div>
        </LiquidGlass>

        <LiquidGlass as="aside" className="lg-panel status-panel" variant="tinted" radius={30} profile="soft" strength={144} magnify={1.18} dispersion={0.05} glare={0.62}>
          <p className="label">Current Layer</p>
          <strong>Refraction</strong>
          <span>96%</span>
        </LiquidGlass>

        <section className="optics-stack" aria-label="Glass samples">
          <LiquidGlass as="article" className="lg-panel metric-card" radius={28} profile="prominent" strength={152} magnify={1.24} dispersion={0.06} glare={0.66}>
            <p className="label">Rim Depth</p>
            <strong>1.46</strong>
            <span className="sparkline" aria-hidden="true"><i /><i /><i /><i /></span>
          </LiquidGlass>
          <LiquidGlass as="article" className="lg-panel compact-card" radius={28} profile="thin" strength={138} magnify={1.16} dispersion={0.05} glare={0.64}>
            <p className="label">Glare</p>
            <strong>62%</strong>
          </LiquidGlass>
        </section>

        <LiquidGlass as="nav" className="lg-panel transport-bar" radius={46} profile="prominent" strength={172} magnify={1.32} dispersion={0.08} glare={0.72} aria-label="Playback controls">
          <div className="track-meta">
            <div className="mini-cover" aria-hidden="true" />
            <div>
              <strong>Glass Channel</strong>
              <span>Live optical surface</span>
            </div>
          </div>

          <div className="transport-actions">
            <LiquidGlass as="button" className="lg-control-button" radius={999} profile="thin" strength={134} magnify={1.16} interactive aria-label="Previous">
              <span>Prev</span>
            </LiquidGlass>
            <LiquidGlass as="button" className="lg-control-button play-button" radius="50%" profile="prominent" strength={164} magnify={1.28} dispersion={0.07} glare={0.82} interactive aria-label="Play">
              <span>Play</span>
            </LiquidGlass>
            <LiquidGlass as="button" className="lg-control-button" radius={999} profile="thin" strength={134} magnify={1.16} interactive aria-label="Next">
              <span>Next</span>
            </LiquidGlass>
          </div>

          <div className="progress" aria-hidden="true"><i /></div>

          <LiquidGlass as="button" className="lg-control-button mode-button is-active" variant="clear" radius={999} profile="thin" strength={138} magnify={1.16} interactive>
            <span>Clear</span>
          </LiquidGlass>
        </LiquidGlass>
      </section>
    </main>
  );
}
