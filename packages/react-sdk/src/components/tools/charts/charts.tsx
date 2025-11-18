import { useMemo, type ComponentProps } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title as TitlePlugin,
} from 'chart.js';
import {
  Pie,
  Bar,
  Line,
  Bubble,
  Doughnut,
  PolarArea,
  Radar,
  Scatter,
} from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  TitlePlugin,
);

const components = {
  pie: Pie,
  bar: Bar,
  line: Line,
  bubble: Bubble,
  doughnut: Doughnut,
  polarArea: PolarArea,
  radar: Radar,
  scatter: Scatter,
  unknown: () => <div>Unknown chart type</div>,
} as const;

const Chart = ({ data }: { data: string }) => {
  const parsedData = useMemo(() => {
    try {
      return JSON.parse(data);
    } catch (error) {
      return new Error('Invalid JSON data for Chart.js');
    }
  }, [data]);

  if (parsedData instanceof Error) {
    return <div className="aicr__chart--error">{parsedData.message}</div>;
  }
  
  const Component =
    components[parsedData.type as keyof typeof components] ??
    components.unknown;

  return (
    <div className="aicr__chart">
      <Component data={parsedData.data} options={parsedData.options} />
    </div>
  );
};

export type ChartProps = ComponentProps<typeof Chart>;

export default Chart;

// Context for usage:
// the application rendering these messages is capable of rendering charts using Chart.js, to render a chart return a markdown code block with language "chartjs" which contains JSON of Chart.js compatible data
