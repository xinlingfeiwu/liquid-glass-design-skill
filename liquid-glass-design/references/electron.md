# Electron Integration

Use this reference when applying Liquid Glass to Electron desktop apps, frameless windows, titlebars, media controls, command palettes, or always-on-top utility surfaces.

## Window Setup

- Prefer normal opaque windows for app content. Use glass inside the renderer for control layers, docks, popovers, and titlebar controls.
- Use `transparent: true` only when the whole BrowserWindow must blend with the desktop; it increases compositor cost and can complicate shadows, hit testing, screenshots, and accessibility.
- On macOS, native `vibrancy` can complement the window chrome, but keep the CSS/SVG Liquid Glass system inside the web content so the material stays consistent across Windows and Linux.
- For frameless windows, separate drag regions from interactive glass:

```css
.titlebar {
  -webkit-app-region: drag;
}

.titlebar button,
.titlebar [data-lg-interactive] {
  -webkit-app-region: no-drag;
}
```

## Renderer Rules

- Keep `contextIsolation: true` and do not expose Node APIs to glass UI code. The material should be pure DOM/CSS/SVG/canvas.
- Generate displacement maps in the renderer, cache by geometry, and avoid doing map work in preload or the main process.
- Use one hidden SVG filter bank per renderer document. Do not create filters in every animation frame.
- In high-DPI windows, keep template supersampling at `2` unless profiling proves the window can afford `3`.
- If the app uses multiple BrowserViews/WebContents, each document needs its own filter bank and cache.

## Performance

- Profile with Chrome DevTools Performance and watch paint/composite cost when moving or resizing large glass windows.
- Keep large docks lower dispersion and lower blur than small buttons. Expensive full-window blur reads as mush and costs more.
- Pause pointer glare and map observers for hidden/minimized windows.
- On battery-sensitive apps, expose a reduced-material mode that lowers `strength`, `glare`, and `dispersion` while preserving layout.

## Platform Notes

- **macOS:** Native vibrancy is useful for chrome; CSS/SVG glass is better for custom controls and cross-platform consistency.
- **Windows:** Transparent windows can lose shadows or trigger costly composition. Prefer in-window dark backdrops plus CSS/SVG glass.
- **Linux:** Compositor behavior varies. Test fallback blur and reduced-transparency mode early.

## QA

- Run Chromium/Electron visual QA against the actual packaged renderer, not only a browser preview.
- Verify frameless drag zones, focus rings, keyboard navigation, and hit targets after applying glass.
- Capture screenshots with the same window size and device scale factor used in release builds.
- Test reduced transparency and reduced motion through OS settings when available.
