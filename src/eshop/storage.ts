import { useEffect, useState } from 'react'

/** Stav uložený v prohlížeči. Když úložiště nejde číst (anonymní okno), použije výchozí hodnotu. */
export function useStoredState<T>(key: string, initial: () => T, isValid: (value: unknown) => boolean = () => true) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (isValid(parsed)) return parsed as T
      }
    } catch {
      // Úložiště není dostupné nebo obsahuje starý formát.
    }
    return initial()
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Bez úložiště se stav jen neuloží pro příště.
    }
  }, [key, value])

  return [value, setValue] as const
}
