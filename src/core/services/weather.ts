// Wrapper de l'API open-meteo, mêmes paramètres et mêmes seuils que l'ancienne app.

export interface DayForecast {
  /** DIM, LUN, ... */
  dayName: string
  icon: string
  tempMax: number
  precipitation: number
}

export interface Weather {
  temp: number
  wind: number
  icon: string
  /** BON | MITIGÉ | PLUIE | VENT */
  label: string
  quality: 'ok' | 'mid' | 'bad'
  forecast: DayForecast[]
}

export function weatherIcon(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '⛅'
  if (code <= 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '🌨️'
  if (code <= 82) return '🌦️'
  if (code <= 99) return '⛈️'
  return '☁️'
}

export function weatherQuality(code: number, wind: number, rainToday: number): { label: string; quality: Weather['quality'] } {
  if (code >= 80 || rainToday > 5) return { label: 'PLUIE', quality: 'bad' }
  if (rainToday > 1 || code >= 51 || wind > 40) return { label: 'MITIGÉ', quality: 'mid' }
  if (wind > 25) return { label: 'VENT', quality: 'mid' }
  return { label: 'BON', quality: 'ok' }
}

const DAY_NAMES = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']

export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true&daily=weathercode,temperature_2m_max,precipitation_sum` +
    `&forecast_days=4&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`open-meteo ${res.status}`)
  const d = await res.json()
  const cw = d.current_weather
  const daily = d.daily
  const rainToday = daily.precipitation_sum[0] || 0
  const { label, quality } = weatherQuality(cw.weathercode, Math.round(cw.windspeed), rainToday)

  return {
    temp: Math.round(cw.temperature),
    wind: Math.round(cw.windspeed),
    icon: weatherIcon(cw.weathercode),
    label,
    quality,
    forecast: daily.weathercode.slice(0, 4).map((code: number, i: number) => ({
      dayName: DAY_NAMES[new Date(daily.time[i]).getDay()],
      icon: weatherIcon(code),
      tempMax: Math.round(daily.temperature_2m_max[i]),
      precipitation: Math.round(daily.precipitation_sum[i] || 0),
    })),
  }
}
