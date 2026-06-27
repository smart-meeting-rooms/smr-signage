'use client';
import { useEffect, useRef, useState } from 'react';

const PAGE_DURATION = 15000;
const PAGES = ['weather','surf','traffic','values','radio'] as const;
type PageName = typeof PAGES[number];

const WMO: Record<number,{label:string;icon:string}> = {
  0:{label:'Clear sky',icon:'☀️'},1:{label:'Mainly clear',icon:'🌤️'},
  2:{label:'Partly cloudy',icon:'⛅'},3:{label:'Overcast',icon:'☁️'},
  45:{label:'Fog',icon:'🌫️'},51:{label:'Drizzle',icon:'🌦️'},
  61:{label:'Light rain',icon:'🌧️'},63:{label:'Rain',icon:'🌧️'},
  65:{label:'Heavy rain',icon:'🌧️'},71:{label:'Snow',icon:'❄️'},
  80:{label:'Showers',icon:'🌦️'},95:{label:'Thunderstorm',icon:'⛈️'},
};

const VALUES = [
  'Put people first',
  'Own it completely',
  'Think boldly, act humbly',
  'Build trust always',
  'Make it simple',
];

const QUOTES = [
  {text:'The best way to predict the future is to create it.',author:'Peter Drucker'},
  {text:'Excellence is not a destination but a continuous journey.',author:'Brian Tracy'},
  {text:'Great things in business are never done by one person.',author:'Steve Jobs'},
  {text:'Innovation distinguishes between a leader and a follower.',author:'Steve Jobs'},
  {text:'Coming together is a beginning. Staying together is progress.',author:'Henry Ford'},
];

interface Weather {
  temp: number;
  feels: number;
  wind: number;
  humidity: number;
  code: number;
  high: number;
  low: number;
}

export default function SignagePage() {
  const [page, setPage] = useState<PageName>('weather');
  const [tick, setTick] = useState(0);
  const [weather, setWeather] = useState<Weather|null>(null);
  const [time, setTime] = useState(new Date());
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let idx = PAGES.indexOf(page);
    const t = setTimeout(() => {
      const next = PAGES[(idx + 1) % PAGES.length];
      setPage(next);
      setTick(n => n + 1);
    }, PAGE_DURATION);
    return () => clearTimeout(t);
  }, [page]);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=0.97&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Europe/London&forecast_days=1')
      .then(r => r.json())
      .then(d => setWeather({
        temp: Math.round(d.current.temperature_2m),
        feels: Math.round(d.current.apparent_temperature),
        wind: Math.round(d.current.wind_speed_10m),
        humidity: d.current.relative_humidity_2m,
        code: d.current.weather_code,
        high: Math.round(d.daily.temperature_2m_max[0]),
        low: Math.round(d.daily.temperature_2m_min[0]),
      }))
      .catch(() => {});
  }, []);

  const toggleRadio = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const wmo = weather ? (WMO[weather.code] ?? {label:'Unknown',icon:'🌡️'}) : null;
  const d = time;
  const dateStr = d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const timeStr = d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  const valIdx = tick % VALUES.length;
  const quoteIdx = tick % QUOTES.length;

  return (
    <div className="relative w-screen h-screen bg-[#0a0a0f] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-5 border-b border-[#1e1e2e]">
        <div>
          <div className="text-2xl font-bold tracking-wide text-white">Smart Meeting Rooms</div>
          <div className="text-sm text-[#64748b] mt-0.5">Workplace Signage</div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-light tabular-nums text-white">{timeStr}</div>
          <div className="text-sm text-[#64748b] mt-0.5">{dateStr}</div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-10 py-6" key={page}>

        {page === 'weather' && (
          <div className="w-full max-w-4xl">
            <div className="text-[#64748b] text-sm uppercase tracking-widest mb-6">📍 Norfolk, UK — Live Weather</div>
            {weather ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 flex flex-col items-center justify-center">
                  <div className="text-8xl mb-4">{wmo?.icon}</div>
                  <div className="text-7xl font-light text-white">{weather.temp}°</div>
                  <div className="text-[#64748b] text-lg mt-2">{wmo?.label}</div>
                  <div className="text-[#64748b] text-sm mt-1">Feels like {weather.feels}°</div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    {label:'High / Low',value:`${weather.high}° / ${weather.low}°`,icon:'📊'},
                    {label:'Wind Speed',value:`${weather.wind} km/h`,icon:'💨'},
                    {label:'Humidity',value:`${weather.humidity}%`,icon:'💧'},
                  ].map(item => (
                    <div key={item.label} className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 flex items-center gap-4">
                      <span className="text-3xl">{item.icon}</span>
                      <div>
                        <div className="text-[#64748b] text-sm">{item.label}</div>
                        <div className="text-white text-2xl font-medium">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-[#64748b] text-center text-2xl">Loading weather...</div>
            )}
          </div>
        )}

        {page === 'surf' && (
          <div className="w-full max-w-3xl text-center">
            <div className="text-[#64748b] text-sm uppercase tracking-widest mb-6">🏄 Surf Report</div>
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12">
              <div className="text-6xl mb-6">🌊</div>
              <div className="text-3xl font-light text-white mb-3">Surf data available on pilot sites</div>
              <div className="text-[#64748b] text-lg">Configure your surf location in the admin panel to see live wave heights, swell period and wind direction from Open-Meteo Marine.</div>
            </div>
          </div>
        )}

        {page === 'traffic' && (
          <div className="w-full max-w-3xl text-center">
            <div className="text-[#64748b] text-sm uppercase tracking-widest mb-6">🚦 Traffic &amp; Commute</div>
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12">
              <div className="text-6xl mb-6">🗺️</div>
              <div className="text-3xl font-light text-white mb-3">Route monitoring ready</div>
              <div className="text-[#64748b] text-lg">Add your commute routes in the admin panel. Live travel times and delays will appear here, powered by TomTom freemium.</div>
            </div>
          </div>
        )}

        {page === 'values' && (
          <div className="w-full max-w-3xl text-center">
            <div className="text-[#64748b] text-sm uppercase tracking-widest mb-8">💡 Our Values</div>
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-14">
              <div className="text-7xl font-light text-white leading-tight mb-8">
                {VALUES[valIdx]}
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {VALUES.map((_,i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i===valIdx?'bg-[#3b82f6]':'bg-[#1e1e2e]'}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {page === 'radio' && (
          <div className="w-full max-w-3xl text-center">
            <div className="text-[#64748b] text-sm uppercase tracking-widest mb-6">🎵 Now Playing</div>
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12">
              <div className="text-8xl mb-6">📻</div>
              <div className="text-4xl font-light text-white mb-2">East Coast Radio</div>
              <div className="text-[#64748b] text-lg mb-10">94–96 FM · KwaZulu-Natal</div>
              <div className="mt-4">
                {QUOTES[quoteIdx] && (
                  <div className="border-t border-[#1e1e2e] pt-8">
                    <div className="text-xl italic text-[#e2e8f0] leading-relaxed">&ldquo;{QUOTES[quoteIdx].text}&rdquo;</div>
                    <div className="text-[#64748b] text-sm mt-3">— {QUOTES[quoteIdx].author}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer nav dots + radio widget */}
      <div className="flex items-center justify-between px-10 py-5 border-t border-[#1e1e2e]">
        <div className="flex gap-3">
          {PAGES.map(p => (
            <button
              key={p}
              onClick={() => { setPage(p); setTick(t => t+1); }}
              className={`w-3 h-3 rounded-full transition-all ${
                p === page ? 'bg-[#3b82f6] scale-125' : 'bg-[#1e1e2e] hover:bg-[#64748b]'
              }`}
            />
          ))}
        </div>
        <button
          onClick={toggleRadio}
          className={`flex items-center gap-3 px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
            playing
              ? 'bg-[#3b82f6] border-[#3b82f6] text-white'
              : 'bg-transparent border-[#1e1e2e] text-[#64748b] hover:border-[#3b82f6] hover:text-white'
          }`}
        >
          <span>{playing ? '⏸' : '▶'}</span>
          <span>ECR Live</span>
          {playing && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
        </button>
      </div>

      <audio ref={audioRef} src="https://live.ecr.co.za/ecrhigh.mp3" preload="none" />
    </div>
  );
}
