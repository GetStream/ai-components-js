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
  Bar as VictoryBar,
  CartesianChart as VictoryChart,
  Line as VictoryLine,
  Pie as VictoryPie,
  PolarChart as VictoryPolarChart,
  Scatter as VictoryScatter,
  // useChartTransformState,
} from 'victory-native';
import { LinearGradient, matchFont, vec } from '@shopify/react-native-skia';

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
    maxWidth: '48%', // lets two items sit per row, tweak as needed
  },
  swatch: {
    borderRadius: 2,
  },
  label: {
    fontSize: 13,
  },
});

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

type BaseVL = { data: { values: Record<string, unknown>[] } };

type VLLayer = Array<{ mark: MarkDef } & Record<string, unknown>>;

type VLMarks = Array<MarkDef>;

export type VegaLite =
  | (BaseVL & {
      mark?: MarkName | MarkDef;
      layer?: VLLayer;
      marks?: VLMarks;
      encoding: XyEncoding;
    })
  | (BaseVL & {
      mark?: MarkName | MarkDef;
      layer?: VLLayer;
      marks?: VLMarks;
      encoding: PieEncoding;
    });

// Normalize mark to a string
export function markType(spec: VegaLite): MarkName | undefined {
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
    // TODO: Check if this is correct ? We only have one group.
    if (t && t[1]) {
      title = t[1]?.trim();
      continue;
    }
    const d = ln.match(/^(?:"([^"]+)"|([^"]+))\s*:\s*([+-]?\d+(?:\.\d+)?)/);
    if (d) {
      const label = (d[1] ?? d[2] ?? '').trim();
      data.push({
        label,
        value: Number(d[3]),
        color: colorFromLabel(label, usedHues),
      });
    }
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
      return { x: xv, y: yv, c };
    })
    .filter(Boolean) as { x: any; y: number; c?: string }[];

  return {
    kind: 'xy',
    mark: markType(spec) ?? 'bar',
    data,
    xIsTime,
    xIsNumeric,
  };
}

// ------- Public component (XL API) -------
export type ChartFromBlockProps =
  | { kind: 'mermaid'; code: string; height?: number }
  | { kind: 'vegalite'; spec: VegaLite; height?: number };

export default function ChartFromBlockXL(props: ChartFromBlockProps) {
  const height = props.height ?? 260;

  const parsed = useMemo(
    () => (props.code ? parseMermaidPie(props.code) : undefined),
    [props.code],
  );
  // vegalite
  const mapped = useMemo(
    () => (props.spec ? toVictoryFromVegaLite(props.spec) : undefined),
    [props.spec],
  );

  // const { state: transformState } = useChartTransformState({
  //   scaleX: 1.5,
  //   scaleY: 1.0,
  // });

  if (props.kind === 'mermaid') {
    if (!parsed?.data.length) return null;
    return (
      <>
        <View style={{ height, width: 200 }}>
          <VictoryPolarChart
            labelKey={'label'}
            valueKey={'value'}
            colorKey={'color'}
            data={parsed.data}
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
    return (
      <>
        <View style={{ height, width: 200 }}>
          <VictoryPolarChart
            labelKey={'label'}
            valueKey={'value'}
            colorKey={'color'}
            data={mapped.data}
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
  const yKeys = seriesNames.map((_name, idx) => `y${idx}` as const);

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

  const table = Array.from(rowsMap.values());

  const totalWidth = 225;

  const visibleBars = table.length;

  const barWidth = (totalWidth - 30 - visibleBars * 2) / visibleBars;

  const maxTickCharCount = mapped.xIsTime
    ? 3
    : Math.max(
        ...table.map((entry) =>
          typeof entry.x === 'string' ? entry.x.length : String(entry.x).length,
        ),
      );

  const hasLongLabels =
    (visibleBars > 4 ? maxTickCharCount > 1 : maxTickCharCount > 5) &&
    !mapped.xIsNumeric;

  return (
    <View style={{ height, width: totalWidth, marginTop: 12 }}>
      <VictoryChart
        data={table}
        xKey="x"
        yKeys={yKeys as string[]}
        domainPadding={{
          left: barWidth * 0.8,
          right: barWidth * 0.8,
          top: 20,
        }}
        xAxis={{
          font,
          formatXLabel: (label: number | string) => {
            const parsedLabel =
              (typeof label === 'number' ? String(label) : label) ?? '';
            if (hasLongLabels && parsedLabel.length > 4) {
              return `${parsedLabel.slice(0, 3)}...`;
            }
            return parsedLabel;
          },
          labelRotate: hasLongLabels ? 90 : 0,
          tickCount: visibleBars,
          labelOffset: hasLongLabels ? 0 : 2,
        }}
        yAxis={[{ font }]}
        padding={{ bottom: hasLongLabels ? 2 * maxTickCharCount + 12 : 0 }}
        // transformState={transformState}
        // transformConfig={{
        //   pinch: { enabled: false },
        //   pan: { enabled: true, dimensions: 'x', activateAfterLongPress: 10 },
        // }}
      >
        {({ points, chartBounds }) => (
          <>
            {/* One primitive per series */}
            {yKeys.map((yk) => {
              const pts = (points as Record<string, any[]>)[yk]!;
              switch (mapped.mark) {
                case 'bar':
                  return (
                    <VictoryBar
                      key={yk}
                      chartBounds={chartBounds}
                      points={pts}
                      innerPadding={0.33}
                      roundedCorners={{
                        topLeft: barWidth * 0.2,
                        topRight: barWidth * 0.2,
                      }}
                    >
                      <LinearGradient
                        start={vec(0, 0)}
                        end={vec(0, 400)}
                        colors={['#a78bfa', '#a78bfa50']}
                      />
                    </VictoryBar>
                  );
                case 'area':
                  return (
                    <VictoryArea
                      key={yk}
                      y0={chartBounds.bottom}
                      points={pts}
                      color={'red'}
                    >
                      <LinearGradient
                        start={vec(0, 0)}
                        end={vec(0, 400)}
                        colors={['#a78bfa', '#a78bfa50']}
                      />
                    </VictoryArea>
                  );
                case 'point':
                  return (
                    <VictoryScatter
                      key={yk}
                      points={pts}
                      radius={3}
                      color={'#a78bfa'}
                    />
                  );
                case 'line':
                default:
                  return (
                    <VictoryLine
                      key={yk}
                      points={pts}
                      strokeWidth={2}
                      color={'#a78bfa'}
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
