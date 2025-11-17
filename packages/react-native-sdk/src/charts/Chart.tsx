import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ChartSpec, Datum } from './types.ts';

import { VictoryChart } from './components/VictoryChart.tsx';

export type ChartFromBlockProps = {
  spec: ChartSpec;
  height?: number;
  width?: number;
};

const Chart = ({ spec, height = 260, width = 225 }: ChartFromBlockProps) => {
  if (!spec) {
    return null;
  }

  return <VictoryChart spec={spec} width={width} height={height} />;
};

export default Chart;
