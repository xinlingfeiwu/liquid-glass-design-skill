#!/usr/bin/env python3
"""Fast structural validation for the Liquid Glass skill package."""

from __future__ import annotations

import sys
from pathlib import Path


REQUIRED_DESCRIPTION_TERMS = [
    "Liquid Glass",
    "iOS 26",
    "glassmorphism",
    "SVG feDisplacementMap",
    "backdrop-filter",
    "refraction",
    "chromatic aberration",
]

REQUIRED_PATHS = [
    "SKILL.md",
    "LICENSE",
    "agents/openai.yaml",
    "assets/core/liquid-glass-core.js",
    "assets/templates/vanilla-liquid-glass/index.html",
    "assets/templates/vanilla-liquid-glass/liquid-glass.js",
    "assets/templates/vanilla-liquid-glass/styles.css",
    "assets/templates/react-liquid-glass/package.json",
    "assets/templates/react-liquid-glass/src/LiquidGlass.jsx",
    "assets/templates/react-liquid-glass/src/displacementMap.js",
    "assets/templates/web-component-liquid-glass/index.html",
    "assets/templates/web-component-liquid-glass/liquid-glass-element.js",
    "scripts/generate-displacement-map.mjs",
    "scripts/check-visual-geometry.mjs",
    "scripts/package-skill.mjs",
    "scripts/run-behavior-eval.mjs",
    "scripts/run-evals.mjs",
    "scripts/test-displacement-map.mjs",
    "scripts/update-readme-preview.mjs",
    "references/golden-glass-style.md",
    "references/practical-workflows.md",
    "references/qa-checklist.md",
    "evals/evals.json",
]

FORBIDDEN_TERMS = [
    "Mine" + "radio",
    "Xx" + "Hub" + "errr",
    "frontend_" + "projects/liquid-glass-svg-backdrop-blur-" + "mr",
]

SKIP_PARTS = {"node_modules", "dist", ".git", ".vite", "coverage", "__pycache__"}
TEXT_SUFFIXES = {".css", ".html", ".js", ".jsx", ".json", ".md", ".mjs", ".py", ".txt", ".yaml", ".yml"}


def fail(message: str) -> None:
    print(f"quick_validate failed: {message}", file=sys.stderr)
    raise SystemExit(1)


def parse_frontmatter(text: str) -> str:
    if not text.startswith("---\n"):
        fail("SKILL.md must start with YAML frontmatter")
    end = text.find("\n---", 4)
    if end == -1:
        fail("SKILL.md frontmatter must close")
    return text[4:end]


def iter_text_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_PARTS for part in path.parts):
            continue
        if path.suffix in TEXT_SUFFIXES:
            yield path


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "liquid-glass-design").resolve()
    if not root.exists():
        fail(f"skill directory does not exist: {root}")
    if root.name != "liquid-glass-design":
        fail("skill directory must be named liquid-glass-design")

    missing = [rel for rel in REQUIRED_PATHS if not (root / rel).exists()]
    if missing:
        fail("missing required paths: " + ", ".join(missing))

    skill_text = (root / "SKILL.md").read_text(encoding="utf-8")
    frontmatter = parse_frontmatter(skill_text)
    if "name: liquid-glass-design" not in frontmatter:
        fail("SKILL.md frontmatter must declare name: liquid-glass-design")
    if "version: 0.3.0" not in frontmatter:
        fail("SKILL.md metadata.version must be 0.3.0")
    for term in REQUIRED_DESCRIPTION_TERMS:
        if term not in frontmatter:
            fail(f"SKILL.md description must include trigger term: {term}")

    combined = []
    for path in iter_text_files(root):
        try:
            combined.append(path.read_text(encoding="utf-8"))
        except UnicodeDecodeError as exc:
            fail(f"text file is not UTF-8: {path.relative_to(root)} ({exc})")
    corpus = "\n".join(combined)
    for term in FORBIDDEN_TERMS:
        if term in corpus:
            fail(f"forbidden source term found: {term}")

    print(f"quick_validate passed: {root}")


if __name__ == "__main__":
    main()
