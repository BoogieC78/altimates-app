import { useEffect, useState } from 'react'
import { fetchWeather, type Weather } from '../core/services/weather'

// Cache module-level : une seule requête open-meteo par coordonnées et par session.
const cache = new Map<string, Promise<Weather>>()

export function useWeather(lat?: number, lon?: number): Weather | null | 'error' {
  const [weather, setWeather] = useState<Weather | null | 'error'>(null)

  useEffect(() => {
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return
    const key = `${lat},${lon}`
    if (!cache.has(key)) cache.set(key, fetchWeather(lat, lon))
    let cancelled = false
    cache
      .get(key)!
      .then((w) => !cancelled && setWeather(w))
      .catch(() => !cancelled && setWeather('error'))
    return () => {
      cancelled = true
    }
  }, [lat, lon])

  return weather
}
