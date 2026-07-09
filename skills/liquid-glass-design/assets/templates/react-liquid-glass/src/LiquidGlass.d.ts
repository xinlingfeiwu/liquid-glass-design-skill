import type { ComponentPropsWithoutRef, ElementType, ForwardedRef, ReactNode } from "react";

export type LiquidGlassVariant = "regular" | "clear" | "tinted";
export type LiquidGlassProfile = "standard" | "soft" | "prominent" | "thin";
export type LiquidGlassAdaptiveOptions = {
  sampleInset?: number;
  fallbackLuminance?: number;
  brightTintAlpha?: number;
  darkTintAlpha?: number;
  throttleMs?: number;
};

export type LiquidGlassProps<T extends ElementType = "div"> = {
  as?: T;
  children?: ReactNode;
  className?: string;
  variant?: LiquidGlassVariant;
  radius?: number | string;
  strength?: number;
  profile?: LiquidGlassProfile;
  magnify?: number;
  bend?: number;
  spread?: number;
  bezelRatio?: number;
  supersample?: number;
  dispersion?: number;
  blur?: number;
  glare?: number;
  elasticity?: number;
  tint?: string;
  adaptive?: boolean | LiquidGlassAdaptiveOptions;
  interactive?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export declare const LiquidGlass: <T extends ElementType = "div">(
  props: LiquidGlassProps<T> & { ref?: ForwardedRef<HTMLElement> }
) => ReactNode;
