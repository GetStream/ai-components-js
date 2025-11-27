import { lazy, Suspense } from 'react';

const Chart = lazy(() => import('./charts'));

export const SuspendedChart = (props: { data: string }) => {
  return (
    <Suspense
      fallback={<div className="aicr__chart--loading">Loading chart...</div>}
    >
      <Chart data={props.data} />
    </Suspense>
  );
};
