import { lazy, Suspense } from 'react';
import ErrorBoundary from '../../ErrorBoundary';

const Chart = lazy(() => import('./charts'));

export const SuspendedChart = (props: { data: string }) => {
  return (
    <ErrorBoundary fallback={<div className='aicr__chart--error'>Failed to load chart.</div>}>
      <Suspense fallback={<div className='aicr__chart--loading'>Loading chart...</div>}>
        <Chart data={props.data} />
      </Suspense>
    </ErrorBoundary>
  );
};
