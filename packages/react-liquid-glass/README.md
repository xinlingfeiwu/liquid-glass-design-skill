# @liquid-glass-design/react

React wrapper from the Liquid Glass Design Skill.

```jsx
import { LiquidGlass } from "@liquid-glass-design/react";
import "@liquid-glass-design/react/style.css";

export function ToolbarButton() {
  return (
    <LiquidGlass as="button" variant="clear" radius={999} adaptive interactive>
      Play
    </LiquidGlass>
  );
}
```

The package ships JSX source, CSS, type declarations, and a generated local copy of the shared Liquid Glass core. Use it with a modern app bundler that transpiles JSX dependencies, or copy `src/` into your own component package and build with your preferred toolchain.
