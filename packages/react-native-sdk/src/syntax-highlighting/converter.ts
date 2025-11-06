import type { TextStyle } from 'react-native';
import type * as ReactNS from 'react'; // for React.CSSProperties
type CSSP = ReactNS.CSSProperties;

/** Options for unit conversion */
type ConvertOpts = {
  /** base for `em` (defaults to 16) */
  baseFontSize?: number;
  /** root base for `rem` (defaults to baseFontSize) */
  rootFontSize?: number;
};

const EM_DEFAULT = 16;

/** Parse CSS lengths like 14, "14", "14px", "1.25em", "0.875rem" */
function len(
  v: unknown,
  { baseFontSize, rootFontSize }: ConvertOpts,
): number | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number') return v; // already a device pixel number (RN)
  if (typeof v !== 'string') return undefined;

  const s = v.trim().toLowerCase();
  if (s.endsWith('px')) {
    const n = Number(s.slice(0, -2));
    return Number.isFinite(n) ? n : undefined;
  }
  if (s.endsWith('em')) {
    const n = Number(s.slice(0, -2));
    return Number.isFinite(n) ? n * (baseFontSize ?? EM_DEFAULT) : undefined;
  }
  if (s.endsWith('rem')) {
    const n = Number(s.slice(0, -3));
    const root = rootFontSize ?? baseFontSize ?? EM_DEFAULT;
    return Number.isFinite(n) ? n * root : undefined;
  }
  // plain number-like string
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** font shorthand: e.g. "italic small-caps 700 14px/20px Menlo, monospace" */
function parseFontShorthand(v: string, opts: ConvertOpts) {
  const out: Partial<TextStyle> = {};
  const parts = v.split(/\s+/);
  // Very light parser: pick out style, weight, size[/lineHeight], and family
  // Strategy:
  // - style: "normal|italic"
  // - weight: "normal|bold|100..900"
  // - when we hit a token like "14px" or "14px/20px" → size & optional lineHeight
  // - everything after size token is font family (may contain commas/spaces)
  let i = 0;

  // style
  if (parts[i] === 'italic' || parts[i] === 'normal') {
    if (parts[i] !== 'normal') out.fontStyle = 'italic';
    i++;
  }

  // (skip small-caps if present; RN uses fontVariant which is separate)
  if (parts[i] === 'small-caps') {
    out.fontVariant = ['small-caps'];
    i++;
  }

  // weight
  if (/^(normal|bold|[1-9]00)$/.test(parts[i] ?? '')) {
    const token = parts[i]!;
    out.fontWeight = (
      token === 'normal' ? undefined : token
    ) as TextStyle['fontWeight'];
    i++;
  }

  // size[/lineHeight]
  const sizeToken = parts[i];
  if (
    sizeToken &&
    (/.+(px|em|rem)$/.test(sizeToken) ||
      /^[\d.]+(\/[\d.]+)?(px|em|rem)?$/.test(sizeToken))
  ) {
    const [fs, lh] = sizeToken.split('/');
    const fontSize = len(fs, opts);
    if (fontSize != null) out.fontSize = fontSize;
    if (lh) {
      const lineHeight = len(lh, opts);
      if (lineHeight != null) out.lineHeight = lineHeight;
    }
    i++;
  }

  // family (rest joined)
  const family = parts.slice(i).join(' ').replace(/^,|,$/g, '').trim();
  if (family) {
    // Basic cleanup: take first family; strip quotes
    const first = family
      .split(',')[0]
      ?.trim()
      .replace(/^["']|["']$/g, '');
    if (first) out.fontFamily = first;
  }

  return out;
}

/** text-decoration shorthand → RN textDecorationLine/Color/Style */
function applyTextDecoration(v: unknown, acc: Partial<TextStyle>) {
  if (typeof v !== 'string') return;
  const tokens = v.toLowerCase().split(/\s+/);
  let line: TextStyle['textDecorationLine'] | undefined = undefined;
  let style: TextStyle['textDecorationStyle'] | undefined;
  let color: TextStyle['textDecorationColor'] | undefined;

  for (const t of tokens) {
    if (t === 'none') line = 'none';
    else if (t === 'underline')
      line = line === 'line-through' ? 'underline line-through' : 'underline';
    else if (t === 'line-through')
      line = line === 'underline' ? 'underline line-through' : 'line-through';
    else if (
      t === 'solid' ||
      t === 'double' ||
      t === 'dotted' ||
      t === 'dashed'
    )
      style = t;
    else if (t) color = t; // naive: treat as color token; RN accepts CSS color strings
  }

  if (line) acc.textDecorationLine = line;
  if (style) acc.textDecorationStyle = style;
  if (color) acc.textDecorationColor = color;
}

/** text-shadow CSS → RN textShadowColor/Offset/Radius
 *  Examples: "1px 1px #000", "1px 1px 2px rgba(0,0,0,0.4)"
 */
function applyTextShadow(
  v: unknown,
  acc: Partial<TextStyle>,
  opts: ConvertOpts,
) {
  if (typeof v !== 'string') return;
  const parts = v.trim().split(/\s+/);
  if (parts.length < 2) return;

  const ox = len(parts[0], opts);
  const oy = len(parts[1], opts);

  let radius: number | undefined;
  let color: string | undefined;

  if (parts[2]) {
    const r = len(parts[2], opts);
    if (Number.isFinite(r!)) {
      radius = r!;
      color = parts.slice(3).join(' ');
    } else {
      color = parts.slice(2).join(' ');
    }
  }

  if (color) acc.textShadowColor = color;
  acc.textShadowOffset = { width: ox ?? 0, height: oy ?? 0 };
  if (radius != null) acc.textShadowRadius = radius;
}

/** map CSS (web) → RN TextStyle */
export function cssToRNTextStyle(
  css: Partial<CSSP>,
  options: ConvertOpts = {},
): TextStyle {
  const opts: ConvertOpts = {
    baseFontSize: options.baseFontSize ?? EM_DEFAULT,
    rootFontSize: options.rootFontSize ?? options.baseFontSize ?? EM_DEFAULT,
  };

  const out: Partial<TextStyle> = {};

  // Simple 1:1 or unit-converted mappings
  if (css.color) out.color = String(css.color);

  if (css.background || css.backgroundColor) {
    // RN ignores complex backgrounds; pass solid color if present
    if (typeof css.backgroundColor === 'string')
      out.backgroundColor = css.backgroundColor;
    else if (typeof css.background === 'string')
      out.backgroundColor = css.background;
  }

  if (css.fontFamily) out.fontFamily = String(css.fontFamily);
  if (css.fontStyle) out.fontStyle = css.fontStyle as TextStyle['fontStyle'];
  if (css.fontWeight)
    out.fontWeight = String(css.fontWeight) as TextStyle['fontWeight'];

  if (css.fontSize != null) {
    const n = len(css.fontSize, opts);
    if (n != null) out.fontSize = n;
  }

  if (css.lineHeight != null) {
    const n = len(css.lineHeight, opts);
    if (n != null) out.lineHeight = n;
  }

  if (css.letterSpacing != null) {
    const n = len(css.letterSpacing, opts);
    if (n != null) out.letterSpacing = n;
  }

  if (css.textAlign) out.textAlign = css.textAlign as TextStyle['textAlign'];
  if (css.textTransform)
    out.textTransform = css.textTransform as TextStyle['textTransform'];

  // Shorthands
  if (css.font && typeof css.font === 'string') {
    Object.assign(out, parseFontShorthand(css.font, opts));
  }

  if (css.textDecoration) {
    applyTextDecoration(css.textDecoration, out);
  }
  if (css.textDecorationLine) {
    // accept direct value too
    out.textDecorationLine =
      css.textDecorationLine as TextStyle['textDecorationLine'];
  }
  if (css.textDecorationColor) {
    out.textDecorationColor = String(css.textDecorationColor);
  }
  if (css.textDecorationStyle) {
    out.textDecorationStyle =
      css.textDecorationStyle as TextStyle['textDecorationStyle'];
  }

  if (css.textShadow) applyTextShadow(css.textShadow, out, opts);

  // Simulating the closest we can get to a CSS overflow-like functionality
  const overflowLike =
    (css as any).overflow ?? (css as any).overflowX ?? (css as any).overflowY;
  if (typeof overflowLike === 'string') {
    out.overflow =
      overflowLike === 'hidden'
        ? 'hidden'
        : overflowLike === 'scroll' || overflowLike === 'auto'
          ? 'scroll'
          : 'visible';
  }

  return out as TextStyle;
}
