// export type Dim = string | number | Date;
export type Dim = string;

export type Datum = {
  /** The categorical/temporal dimension (label, category, or time). */
  dimension: Dim;
  /** The numeric measure/value. */
  value: number;
  /** Color for this datum; the renderer will fall back to series color. */
  color: string;
  /** Optional series key for multi-series charts (e.g., region). */
  series?: string;
};

export type ChartType = 'bar' | 'line' | 'area' | 'point' | 'pie';

export type ChartSpec = {
  /** Final mark/type to render. */
  type: ChartType;

  /** Flat, tidy table. Group by `series` if present. */
  data: Datum[];

  /** Optional per-series color preference. */
  seriesColors?: Record<string, string>;

  /** Metadata (optional). */
  title?: string;

  /** Hints (optional; static only). */
  stacked?: boolean | 'normalize';
  orientation?: 'vertical' | 'horizontal';
  isTemporalDim?: boolean;
  isNumericDim?: boolean;
  donutInnerRadius?: number;

  /** Optional fixed category/time ordering. */
  dimDomain?: Dim[];
};
