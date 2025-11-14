// ChartFromBlock.tsx
// ChartFromBlockXL.tsx
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import type { ChartSpec, Datum } from './types.ts';

import { VictoryChart } from './victory/VictoryChart.tsx';
import type { VegaLite } from './vega-lite/schema.ts';

export type LegendItem = { label: string; color: string };
export function PieLegend({
  items,
  align = 'center',
  maxRows = 3,
  swatchSize = 12,
  style,
  textStyle,
}: {
  items: Datum[];
  align?: 'left' | 'center' | 'right';
  maxRows?: number;
  swatchSize?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}) {
  const justifyContent =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  return (
    <View style={[styles.container, { justifyContent }, style]}>
      {items.slice(0, maxRows * 4).map((it, i) => (
        <View key={`${it.dimension}-${i}`} style={styles.item}>
          <View
            style={[
              styles.swatch,
              {
                width: swatchSize,
                height: swatchSize,
                backgroundColor: it.color,
              },
            ]}
          />
          <Text numberOfLines={1} style={[styles.label, textStyle]}>
            {it.dimension}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '48%', // lets two items sit per row, tweak as needed
  },
  swatch: {
    borderRadius: 2,
  },
  label: {
    fontSize: 13,
  },
});

// Normalize mark to a string
export function markType(spec: VegaLite) {
  if (spec.mark) {
    return typeof spec.mark === 'string' ? spec.mark : spec.mark.type;
  }
  const firstLayerMark =
    spec.layer && spec.layer[0] ? spec.layer[0].mark.type : undefined;
  const firstMark =
    spec.marks && spec.marks.length > 0 ? spec.marks[0] : undefined;
  return firstLayerMark ? firstLayerMark : firstMark?.type;
}

// ---- hashing & rng ----
function hashLabel(raw: string) {
  const s = raw.trim().toLowerCase().normalize('NFKC');
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function xorshift32(seed: number) {
  let x = seed || 123456789;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}

// ---- color utils ----
function hslToHex(h: number, s = 68, l = 52) {
  const S = s / 100,
    L = l / 100;
  const C = (1 - Math.abs(2 * L - 1)) * S;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - C / 2;
  const [r1, g1, b1] =
    h < 60
      ? [C, X, 0]
      : h < 120
        ? [X, C, 0]
        : h < 180
          ? [0, C, X]
          : h < 240
            ? [0, X, C]
            : h < 300
              ? [X, 0, C]
              : [C, 0, X];
  const r = Math.round((r1 + m) * 255)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round((g1 + m) * 255)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round((b1 + m) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}`;
}

// ensure hues not closer than MIN_SEP degrees within the same chart
function colorFromLabel(
  label: string,
  usedHues: number[],
  opts?: { minSep?: number; sat?: number; light?: number },
) {
  const { minSep = 25, sat = 68, light = 52 } = opts || {};
  const seed = hashLabel(label);
  const rand = xorshift32(seed);

  // base hue from RNG (looks random, but stable)
  let hue = Math.floor(rand() * 360);

  // nudge away from already-used hues in THIS chart
  let attempts = 0;
  const tooClose = (h: number) =>
    usedHues.some((u) => {
      const d = Math.abs(h - u);
      return Math.min(d, 360 - d) < minSep;
    });

  while (tooClose(hue) && attempts < 48) {
    hue = (hue + 137.508) % 360; // golden-angle hop
    attempts++;
  }

  usedHues.push(hue);
  return hslToHex(hue, sat, light);
}

function parseMermaidPie(code: string): ChartSpec {
  const lines = code.split(/\r?\n/).map((l) => l.trim());
  // TODO: This is bad. Fix this please.
  if (!/^pie\b/i.test(lines[0] || '')) return { type: 'pie', data: [] };
  let title: string | undefined;
  const data: Datum[] = [];
  const usedHues: number[] = [];
  for (const ln of lines.slice(1)) {
    const t = ln.match(/^title\s+(.+)$/i);
    // TODO: Check if this is correct ? We only have one group.
    if (t && t[1]) {
      title = t[1]?.trim();
      continue;
    }
    const d = ln.match(/^(?:"([^"]+)"|([^"]+))\s*:\s*([+-]?\d+(?:\.\d+)?)/);
    if (d) {
      const label = (d[1] ?? d[2] ?? '').trim();
      data.push({
        dimension: label,
        value: Number(d[3]),
        color: colorFromLabel(label, usedHues),
      });
    }
  }
  return { type: 'pie', title, data };
}

function toVictoryFromVegaLite(spec: VegaLite): ChartSpec {
  const mark = markType(spec);
  if (markType(spec) === 'arc') {
    const tField = (spec as any).encoding?.theta?.field;
    const cField = (spec as any).encoding?.color?.field;
    const usedHues: number[] = [];
    const data = (spec.data?.values ?? [])
      .map((d) => {
        const y = Number(d[tField]);
        const x = cField ? String(d[cField]) : '';
        return Number.isFinite(y)
          ? {
              dimension: x.trim(),
              value: y,
              color: colorFromLabel(x, usedHues),
            }
          : null;
      })
      .filter(Boolean) as Datum[];
    return { type: 'pie', data };
  }

  const { x, y, color } = (spec as any).encoding;
  const xField = x?.field,
    yField = y?.field;
  const xIsTime = (x?.type ?? '').toLowerCase() === 'temporal';
  const xIsNumeric = (x?.type ?? '').toLowerCase() === 'quantitative';

  const data = (spec.data?.values ?? [])
    .map((d) => {
      const xv =
        xIsTime && typeof d[xField] === 'string'
          ? new Date(d[xField])
          : d[xField];
      const yv = Number(d[yField]);
      if (!Number.isFinite(yv)) return null;
      const c = color?.field ? String(d[color.field]) : undefined;
      return { dimension: xv, value: yv, color: c };
    })
    .filter(Boolean) as Datum[];

  return {
    // @ts-expect-error bla bla
    type: mark === 'arc' ? 'pie' : (mark ?? 'bar'),
    data,
    isTemporalDim: xIsTime,
    isNumericDim: xIsNumeric,
  };
}

// ------- Public component (XL API) -------
export type ChartFromBlockProps =
  | { kind: 'mermaid'; code: string; height?: number }
  | { kind: 'vegalite'; spec: VegaLite; height?: number };

export default function ChartFromBlockXL(props: ChartFromBlockProps) {
  const height = props.height ?? 260;

  const spec = useMemo(
    () =>
      // @ts-expect-error bla bla
      props.code
        ? // @ts-expect-error bla bla
          parseMermaidPie(props.code)
        : // @ts-expect-error bla bla
          props.spec
          ? // @ts-expect-error bla bla
            toVictoryFromVegaLite(props.spec)
          : undefined,
    // @ts-expect-error bla bla
    [props.code, props.spec],
  );

  if (!spec) {
    return null;
  }

  // const { state: transformState } = useChartTransformState({
  //   scaleX: 1.5,
  //   scaleY: 1.0,
  // });

  return <VictoryChart spec={spec} width={225} height={height} />;
}
