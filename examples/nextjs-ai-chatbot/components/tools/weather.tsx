import type { WeatherToolResponse } from '@/types';
import { CloudSunIcon, MapPinIcon } from 'lucide-react';

export default function Weather({ data }: { data: string }) {
  const weather: WeatherToolResponse = JSON.parse(data);
  return (
    <div className="bg-base-200 p-4 pb-8 rounded-lg relative overflow-hidden min-w-sm">
      <div className="text-lg font-bold flex items-center gap-2">
        <MapPinIcon className="w-4 h-4" />
        {weather.location?.name || 'Unknown'}
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-4 items-center justify-center my-4 font-bold">
        <div>
          <img
            src={weather.current?.condition?.icon}
            alt={weather.current?.condition?.text}
            className="object-cover not-prose bg-base-100 rounded-lg p-2"
            width={64}
            height={64}
          />
        </div>
        <div>
          Current: {weather.current?.temp_c}°C
          <br /> Feels like: {weather.current?.feelslike_c}°C
        </div>
      </div>
      <div className="text-sm text-gray-500">
        <div>Condition: {weather.current?.condition?.text}</div>
        <div>Wind: {weather.current?.wind_kph} km/h</div>
        <div>Humidity: {weather.current?.humidity}%</div>
        <div>Pressure: {weather.current?.pressure_mb} mb</div>
      </div>
      <div className="flex items-center gap-1 opacity-50 text-xs absolute bottom-2 right-2 text-[#00ffe0]">
        <CloudSunIcon className="w-3 h-3" />
        <span className="ai-thinking">weather tool</span>
      </div>
    </div>
  );
}
