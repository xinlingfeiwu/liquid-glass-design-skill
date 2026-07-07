import { LiquidGlass } from "./LiquidGlass.jsx";
import "./app.css";

export default function App() {
  return (
    <main className="app-shell">
      <section className="visual-stage" aria-label="Liquid Glass control demo">
        <div className="scene-layers" aria-hidden="true">
          <span className="sun-disc" />
          <div className="detail-rings" />
          <div className="detail-dots" />
          <span className="blob blob-a" />
          <span className="blob blob-b" />
          <div className="horizon-lines" />
        </div>

        <header className="top-strip" aria-label="Primary controls">
          <LiquidGlass as="button" className="top-button" radius={999} profile="thin" strength={118} magnify={1.08} interactive>
            Library
          </LiquidGlass>
          <LiquidGlass as="button" className="top-button is-active" radius={999} profile="thin" strength={124} magnify={1.1} interactive>
            Now
          </LiquidGlass>
          <LiquidGlass as="button" className="top-button" radius={999} profile="thin" strength={118} magnify={1.08} interactive>
            Scene
          </LiquidGlass>
        </header>

        <section className="lyric-stack" aria-hidden="true">
          <p>warm light across the valley</p>
          <h1>Day Trip</h1>
          <p>colors folding into motion</p>
        </section>

        <LiquidGlass as="aside" className="lg-panel status-panel" variant="tinted" radius={30} profile="soft" strength={128} magnify={1.12} glare={0.6}>
          <p className="label">Current Layer</p>
          <strong>Atmosphere</strong>
          <span>82%</span>
        </LiquidGlass>

        <LiquidGlass as="nav" className="lg-panel transport-bar" radius={46} profile="prominent" strength={148} magnify={1.24} dispersion={0.1} glare={0.64} aria-label="Playback controls">
          <div className="track-meta">
            <div className="mini-cover" aria-hidden="true" />
            <div>
              <strong>Day Trip</strong>
              <span>Studio channel</span>
            </div>
          </div>

          <div className="transport-actions">
            <LiquidGlass as="button" className="lg-control-button" radius={999} profile="thin" strength={120} magnify={1.1} interactive aria-label="Previous">
              Prev
            </LiquidGlass>
            <LiquidGlass as="button" className="lg-control-button play-button" radius="50%" profile="prominent" strength={140} magnify={1.2} dispersion={0.11} glare={0.74} interactive aria-label="Play">
              Play
            </LiquidGlass>
            <LiquidGlass as="button" className="lg-control-button" radius={999} profile="thin" strength={120} magnify={1.1} interactive aria-label="Next">
              Next
            </LiquidGlass>
          </div>

          <div className="progress" aria-hidden="true"><i /></div>

          <LiquidGlass as="button" className="lg-control-button mode-button is-active" variant="clear" radius={999} profile="thin" strength={124} magnify={1.1} interactive>
            Clear
          </LiquidGlass>
        </LiquidGlass>
      </section>
    </main>
  );
}
