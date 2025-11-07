// ChartFromBlock.tsx
// ChartFromBlockXL.tsx
import React, { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import {
  Area as VictoryArea,
  // CartesianAxis as VictoryAxis,
  Bar as VictoryBar,
  CartesianChart as VictoryChart,
  Line as VictoryLine,
  Pie as VictoryPie,
  Scatter as VictoryScatter,
  PolarChart as VictoryPolarChart,
} from 'victory-native';
import { matchFont } from '@shopify/react-native-skia';

const font = matchFont({
  fontFamily: Platform.select({
    ios: 'Helvetica',
    android: 'sans-serif',
    default: 'serif',
  }),
  fontSize: 12,
  fontWeight: 'normal', // 'bold' | number | 'normal'
  fontStyle: 'normal', // 'italic' | 'normal' | 'oblique'
});

export type LegendItem = { label: string; color: string };
export function PieLegend({
  items,
  align = 'center',
  maxRows = 3,
  swatchSize = 12,
  style,
  textStyle,
}: {
  items: LegendItem[];
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
        <View key={`${it.label}-${i}`} style={styles.item}>
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
            {it.label}
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
    maxWidth: '48%', // lets two items sit per row; tweak as needed
  },
  swatch: {
    borderRadius: 2,
  },
  label: {
    fontSize: 13,
  },
});

// ------- (same helpers as before) -------
type VLType = 'quantitative' | 'nominal' | 'temporal' | 'ordinal';

type MarkName = 'bar' | 'line' | 'area' | 'point' | 'arc';
type MarkDef = { type: MarkName } & Record<string, unknown>; // allow extra props

type XyEncoding = {
  x: { field: string; type?: VLType };
  y: { field: string; type?: VLType };
  color?: { field?: string; type?: VLType };
};

type PieEncoding = {
  theta: { field: string; type?: VLType };
  color?: { field: string; type?: VLType };
};

type BaseVL = { data: { values: Record<string, any>[] } };

export type VegaLite =
  | (BaseVL & { mark: MarkName | MarkDef; encoding: XyEncoding })
  | (BaseVL & { mark: MarkName | MarkDef; encoding: PieEncoding });

// Normalize mark to a string
export function markType(spec: { mark: MarkName | MarkDef }): MarkName {
  if (spec.mark) {
    return typeof spec.mark === 'string' ? spec.mark : spec.mark.type;
  }
  const firstLayerMark =
    spec.layer && spec.layer.length > 0 ? spec.layer[0].mark.type : undefined;
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

// export function hashLabel(raw: string) {
//   const s = raw.trim().toLowerCase().normalize('NFKC');
//   let h = 2166136261 >>> 0; // FNV-1a
//   for (let i = 0; i < s.length; i++) {
//     h ^= s.charCodeAt(i);
//     h = Math.imul(h, 16777619) >>> 0;
//   }
//   return h >>> 0;
// }
//
// // A bigger categorical palette reduces collisions.
// // (Tableau10 extended with a few distinct extras)
// const PALETTE = [
//   '#4e79a7',
//   '#f28e2b',
//   '#e15759',
//   '#76b7b2',
//   '#59a14f',
//   '#edc949',
//   '#af7aa1',
//   '#ff9da7',
//   '#9c755f',
//   '#bab0ab',
//   '#8cd17d',
//   '#b6992d',
//   '#499894',
//   '#86bcb6',
//   '#e39d9e',
// ];
//
// export function colorFromLabel(label: string, usedIdx = new Set<number>()) {
//   const base = hashLabel(label);
//   let idx = base % PALETTE.length;
//   // linear probe to avoid same color within one chart
//   let steps = 0;
//   while (usedIdx.has(idx) && steps < PALETTE.length) {
//     idx = (idx + 1) % PALETTE.length;
//     steps++;
//   }
//   usedIdx.add(idx);
//   return PALETTE[idx];
// }

function parseMermaidPie(code: string): {
  title?: string;
  data: { label: string; value: number; color: string }[];
} {
  const lines = code.split(/\r?\n/).map((l) => l.trim());
  if (!/^pie\b/i.test(lines[0] || '')) return { data: [] };
  let title: string | undefined;
  const data: { label: string; value: number; color: string }[] = [];
  const usedHues: number[] = [];
  for (const ln of lines.slice(1)) {
    const t = ln.match(/^title\s+(.+)$/i);
    if (t) {
      title = t[1].trim();
      continue;
    }
    const d = ln.match(/^(?:"([^"]+)"|([^"]+))\s*:\s*([+-]?\d+(?:\.\d+)?)/);
    const label = (d[1] ?? d[2] ?? '').trim();
    if (d)
      data.push({
        label,
        value: Number(d[3]),
        color: colorFromLabel(label, usedHues),
      });
  }
  return { title, data };
}

function toVictoryFromVegaLite(spec: VegaLite):
  | {
      kind: 'xy';
      mark: 'bar' | 'line' | 'area' | 'point';
      data: { x: any; y: number; c?: string }[];
      xIsTime?: boolean;
    }
  | { kind: 'pie'; data: { label: string; value: number; color: string }[] } {
  if (markType(spec) === 'arc') {
    const tField = (spec as any).encoding?.theta?.field;
    const cField = (spec as any).encoding?.color?.field;
    const usedHues: number[] = [];
    const data = (spec.data?.values ?? [])
      .map((d) => {
        const y = Number(d[tField]);
        const x = cField ? String(d[cField]) : '';
        return Number.isFinite(y)
          ? { label: x.trim(), value: y, color: colorFromLabel(x, usedHues) }
          : null;
      })
      .filter(Boolean) as { label: string; value: number; color: string }[];
    return { kind: 'pie', data };
  }

  const { x, y, color } = (spec as any).encoding;
  const xField = x?.field,
    yField = y?.field;
  const xIsTime = (x?.type ?? '').toLowerCase() === 'temporal';

  const data = (spec.data?.values ?? [])
    .map((d) => {
      const xv = xIsTime ? new Date(d[xField]) : d[xField];
      const yv = Number(d[yField]);
      if (!Number.isFinite(yv)) return null;
      const c = color?.field ? String(d[color.field]) : undefined;
      return { x: xv, y: yv, c };
    })
    .filter(Boolean) as { x: any; y: number; c?: string }[];

  return { kind: 'xy', mark: markType(spec), data, xIsTime };
}

// ------- Public component (XL API) -------
export type ChartFromBlockProps =
  | { kind: 'mermaid'; code: string; height?: number }
  | { kind: 'vegalite'; spec: VegaLite; height?: number };

export default function ChartFromBlockXL(props: ChartFromBlockProps) {
  console.log('RENDER', props);
  const height = props.height ?? 260;

  // Skia font required for axes / tick labels
  // (swap to your bundled TTF/OTF)
  // const font = useFont(require('./assets/Inter-Medium.ttf'), 12);

  const parsed = useMemo(
    () => (props.code ? parseMermaidPie(props.code) : undefined),
    [props.code],
  );
  // vegalite
  const mapped = useMemo(
    () => (props.spec ? toVictoryFromVegaLite(props.spec) : undefined),
    [props.spec],
  );

  if (props.kind === 'mermaid') {
    if (!parsed?.data.length) return null;
    // console.log('PARSED: ', parsed);
    return (
      <>
        <View style={{ height, width: 200 }}>
          <VictoryPolarChart
            labelKey={'label'}
            valueKey={'value'}
            colorKey={'color'}
            data={parsed.data}
            // containerStyle={{ flex: 1, maxWidth: 200 }}
          >
            <VictoryPie.Chart />
          </VictoryPolarChart>
        </View>
        <PieLegend items={parsed.data} align={'center'} />
      </>
    );
  }

  if (props.kind === 'vegalite' && mapped && mapped?.kind === 'pie') {
    if (!mapped?.data.length) return null;
    // console.log('TEST', mapped);
    return (
      <>
        <View style={{ height, width: 200 }}>
          <VictoryPolarChart
            labelKey={'label'}
            valueKey={'value'}
            colorKey={'color'}
            data={mapped.data}
            // containerStyle={{ flex: 1, maxWidth: 200 }}
          >
            <VictoryPie.Chart />
          </VictoryPolarChart>
        </View>
        <PieLegend items={mapped.data} align={'center'} />
      </>
    );
  }

  // Group by color (c) into series; XL uses yKeys + render-prop "points"
  const seriesNames = Array.from(
    new Set(mapped.data.map((d) => d.c ?? 'series')),
  );
  const yKeys = seriesNames.map((name, idx) => `y${idx}` as const);
  type YKey = (typeof yKeys)[number];

  // Normalize data into one row per x, with columns y0,y1,... for each series
  const rowsMap = new Map<string | number, Record<string, any>>();
  for (const s of seriesNames) {
    const keyIndex = seriesNames.indexOf(s);
    const yKey = yKeys[keyIndex];
    for (const pt of mapped.data.filter((d) => (d.c ?? 'series') === s)) {
      const xKey =
        mapped.xIsTime && pt.x instanceof Date ? pt.x.getTime() : pt.x;
      const row = rowsMap.get(xKey) ?? { x: pt.x };
      row[yKey] = pt.y;
      rowsMap.set(xKey, row);
    }
  }
  const table = Array.from(rowsMap.values()).sort((a, b) => {
    const ax = a.x instanceof Date ? a.x.getTime() : a.x;
    const bx = b.x instanceof Date ? b.x.getTime() : b.x;
    return ax < bx ? -1 : ax > bx ? 1 : 0;
  });

  return (
    <View style={{ height, width: 225, marginTop: 12 }}>
      <VictoryChart
        data={table}
        xKey="x"
        yKeys={yKeys as string[]}
        // Optional: domain padding etc. See docs.
        domainPadding={{ left: 20, right: 20 }}
        // axisOptions={{
        //   font,
        //   formatXLabel: (label: string) => label ?? '',
        // }}
        xAxis={{
          font,
          formatXLabel: (label: number | string) =>
            (typeof label === 'number' ? String(label) : label) ?? '',
        }}
        yAxis={[{ font }]}
        padding={{ bottom: 5 }}
      >
        {({ points, chartBounds }) => (
          <>
            {/* One primitive per series */}
            {yKeys.map((yk, i) => {
              const pts = (points as Record<string, any[]>)[yk]!;
              switch (mapped.mark) {
                case 'bar':
                  return (
                    <VictoryBar
                      key={yk}
                      chartBounds={chartBounds}
                      points={pts}
                      color={'red'}
                      roundedCorners={{ topLeft: 10, topRight: 10 }}
                    />
                  );
                case 'area':
                  return (
                    <VictoryArea
                      key={yk}
                      y0={chartBounds.bottom}
                      points={pts}
                    />
                  );
                case 'point':
                  return <VictoryScatter key={yk} points={pts} radius={3} />;
                case 'line':
                default:
                  return (
                    <VictoryLine
                      key={yk}
                      points={pts}
                      strokeWidth={2}
                      connectMissingData={true}
                    />
                  );
              }
            })}
          </>
        )}
      </VictoryChart>
    </View>
  );
}

/** ---------------------------
 *  4) USAGE EXAMPLES
 *  (A) Mermaid pie → VictoryPie
 * ----------------------------*/
// const mermaidPie = `pie
//   title Browser Usage
//   "Chrome" : 60
//   "Safari" : 20
//   "Firefox" : 10
//   "Other" : 10
// `;
// <ChartFromBlock kind="mermaid" code={mermaidPie} />

/** ---------------------------
 *  (B) Vega-Lite bar → VictoryBar
 * ----------------------------*/
// const vlBar = {
//   $schema: "https://vega.github.io/schema/vega-lite/v5.json",
//   data: { values: [ { category: "A", value: 10 }, { category: "B", value: 30 } ] },
//   mark: "bar",
//   encoding: {
//     x: { field: "category", type: "nominal" },
//     y: { field: "value", type: "quantitative" }
//   }
// } as const;
// <ChartFromBlock kind="vegalite" spec={vlBar} showLegend={false} />

/** ---------------------------
 *  (C) Vega-Lite line (temporal) → VictoryLine
 * ----------------------------*/
// const vlLine = {
//   data: { values: [
//     { date: "2025-01-01", price: 10 },
//     { date: "2025-02-01", price: 12 },
//     { date: "2025-03-01", price: 11 },
//   ] },
//   mark: "line",
//   encoding: {
//     x: { field: "date", type: "temporal" },
//     y: { field: "price", type: "quantitative" }
//   }
// } as const;
// <ChartFromBlock kind="vegalite" spec={vlLine} />

/** ---------------------------
 *  (D) Vega-Lite pie (arc) → VictoryPie
 * ----------------------------*/
// const vlPie = {
//   data: { values: [
//     { label: "A", v: 10 }, { label: "B", v: 20 }, { label: "C", v: 15 }
//   ] },
//   mark: "arc",
//   encoding: {
//     theta: { field: "v", type: "quantitative" },
//     color: { field: "label", type: "nominal" }
//   }
// } as const;
// <ChartFromBlock kind="vegalite" spec={vlPie} />
