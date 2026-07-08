import { useState } from "react";
import { LiquidGlass } from "./LiquidGlass.jsx";
import "./app.css";

export default function App() {
  const [scene, setScene] = useState("prism");
  const sceneButtons = ["prism", "noir", "signal"];

  return (
    <main className="app-shell">
      <section className="visual-stage" data-scene={scene} aria-label="Liquid Glass control demo">
        <div className="scene-layers" aria-hidden="true">
          <span className="sun-disc" />
          <div className="detail-rings" />
          <div className="detail-dots" />
          <div className="photo-field" />
          <div className="signal-grid" />
          <span className="blob blob-a" />
          <span className="blob blob-b" />
          <div className="horizon-lines" />
        </div>

        <header className="top-strip" aria-label="Primary controls">
          {sceneButtons.map((item) => (
            <LiquidGlass
              key={item}
              as="button"
              className={`top-button ${scene === item ? "is-active" : ""}`}
              radius={999}
              profile="thin"
              strength={132}
              magnify={1.16}
              interactive
              onClick={() => setScene(item)}
            >
              <span>{item[0].toUpperCase() + item.slice(1)}</span>
            </LiquidGlass>
          ))}
        </header>

        <section className="lyric-stack" aria-hidden="true">
          <p>midnight signal over the valley</p>
          <h1>Liquid</h1>
          <p>glass channel in motion</p>
        </section>

        <LiquidGlass as="aside" className="lg-panel status-panel" variant="tinted" radius={30} profile="soft" strength={150} magnify={1.22} dispersion={0.08} glare={0.64}>
          <p className="label">Current Layer</p>
          <strong>Refraction</strong>
          <span>92%</span>
        </LiquidGlass>

        <section className="optics-stack" aria-label="Glass samples">
          <LiquidGlass as="article" className="lg-panel metric-card" radius={28} profile="prominent" strength={162} magnify={1.32} dispersion={0.11} glare={0.68}>
            <p className="label">Rim Index</p>
            <strong>1.46</strong>
            <span className="sparkline" aria-hidden="true"><i /><i /><i /><i /></span>
          </LiquidGlass>
          <LiquidGlass as="article" className="lg-panel metric-card compact-card" radius={28} profile="thin" strength={150} magnify={1.24} dispersion={0.1} glare={0.7}>
            <p className="label">Light Angle</p>
            <strong>38deg</strong>
          </LiquidGlass>
        </section>

        <LiquidGlass as="nav" className="lg-panel transport-bar" radius={48} profile="prominent" strength={176} magnify={1.38} dispersion={0.13} glare={0.72} aria-label="Playback controls">
          <div className="track-meta">
            <div className="mini-cover" aria-hidden="true" />
            <div>
              <strong>Glass Channel</strong>
              <span>Live optical pass</span>
            </div>
          </div>

          <div className="transport-actions">
            <LiquidGlass as="button" className="lg-control-button" radius={999} profile="thin" strength={138} magnify={1.2} interactive aria-label="Previous">
              <span>Prev</span>
            </LiquidGlass>
            <LiquidGlass as="button" className="lg-control-button play-button" radius="50%" profile="prominent" strength={168} magnify={1.36} dispersion={0.13} glare={0.82} interactive aria-label="Play">
              <span>Play</span>
            </LiquidGlass>
            <LiquidGlass as="button" className="lg-control-button" radius={999} profile="thin" strength={138} magnify={1.2} interactive aria-label="Next">
              <span>Next</span>
            </LiquidGlass>
          </div>

          <div className="progress" aria-hidden="true"><i /></div>

          <LiquidGlass as="button" className="lg-control-button mode-button is-active" variant="clear" radius={999} profile="thin" strength={142} magnify={1.2} interactive>
            <span>Clear</span>
          </LiquidGlass>
        </LiquidGlass>
      </section>
    </main>
  );
}
