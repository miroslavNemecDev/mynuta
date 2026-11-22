// Časy výdeje podle otevírací doby z landing page: Po–Pá 8–20, So 9–12, v neděli zavřeno.
import { dayKey, dayLabel, timeLabel } from './text.ts'

// Index podle Date.getDay(): 0 = neděle
const OPENING_HOURS: (readonly [number, number] | null)[] = [null, [8, 20], [8, 20], [8, 20], [8, 20], [8, 20], [9, 12]]
const LEAD_MINUTES = 60
const STEP_MINUTES = 30

export type PickupWindow = { start: number; end: number }
export type PickupDay = { key: string; label: string; title: string; date: string; when: string; slots: number[]; windows: PickupWindow[] }
const WINDOW_MINUTES = 120

const WEEKDAYS = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
// „ve středu“, „v pondělí“: tvar do věty „Vyzvedneš ve středu 25. 11.“
const WEEKDAYS_IN = ['v neděli', 'v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu']

/** Nejbližší dny s volným výdejem. Sloty po půlhodinách, nejdřív hodinu od teď. */
export function pickupDays(now: Date, count = 6): PickupDay[] {
  const earliest = now.getHours() * 60 + now.getMinutes() + LEAD_MINUTES
  const days: PickupDay[] = []
  for (let offset = 0; offset < 14 && days.length < count; offset += 1) {
    const date = new Date(now)
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() + offset)
    const hours = OPENING_HOURS[date.getDay()]
    if (!hours) continue
    const slots: number[] = []
    for (let minutes = hours[0] * 60; minutes <= hours[1] * 60 - STEP_MINUTES; minutes += STEP_MINUTES) {
      if (offset === 0 && minutes < earliest) continue
      slots.push(minutes)
    }
    if (!slots.length) continue
    // Přibližné okno příchodu po dvou hodinách. Den platí, okno jen pomůže mít nákup připravený včas.
    const windows: PickupWindow[] = []
    for (let start = hours[0] * 60; start < hours[1] * 60; start += WINDOW_MINUTES) {
      const end = Math.min(start + WINDOW_MINUTES, hours[1] * 60)
      const from = offset === 0 ? Math.max(start, slots[0]) : start
      if (from <= end - STEP_MINUTES) windows.push({ start: from, end })
    }
    const label = dayLabel(date, now)
    const dateText = `${date.getDate()}.\u00a0${date.getMonth() + 1}.`
    const relative = label === 'Dnes' || label === 'Zítra'
    days.push({
      key: dayKey(date),
      label,
      title: relative ? label : WEEKDAYS[date.getDay()],
      date: dateText,
      when: relative ? label.toLocaleLowerCase('cs') : `${WEEKDAYS_IN[date.getDay()]} ${dateText}`,
      slots,
      windows,
    })
  }
  return days
}

/** „dnes 17:00“, „zítra 9:30“, „po 23. 11. 8:00“ */
export function pickupLabel(day: PickupDay, minutes: number): string {
  return `${day.label.toLocaleLowerCase('cs')} ${timeLabel(minutes)}`
}

function shortTime(minutes: number): string {
  return minutes % 60 ? timeLabel(minutes) : String(minutes / 60)
}

/** „8–10“, „14:30–16“ */
export function windowLabel(window: PickupWindow): string {
  return `${shortTime(window.start)}–${shortTime(window.end)}`
}

/** Část dne k oknu, aby se dalo vybírat i podle pocitu. */
export function windowPart(window: PickupWindow): string {
  const hour = window.start / 60
  if (hour < 10) return 'ráno'
  if (hour < 12) return 'dopoledne'
  if (hour < 14) return 'v poledne'
  if (hour < 16) return 'odpoledne'
  if (hour < 18) return 'podvečer'
  return 'večer'
}
