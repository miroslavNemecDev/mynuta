// Ikony Mynuty ze src/assets/icons. Barvy se nahradí proměnnými, aby šly použít na světlém i zeleném podkladu.
const rawIcons = import.meta.glob<string>('../assets/icons/svg-svetle/*.svg', { query: '?raw', import: 'default', eager: true })

// Dvě ikony, které v sadě zatím chybí (mražené, recepty). Kreslené stejným stylem, než vzniknou oficiální.
const extraIcons: Record<string, string> = {
  mrazene: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#14532D" stroke-width="2"><path d="M12 3v18"/><path d="M4.2 7.5l15.6 9"/><path d="M4.2 16.5l15.6-9"/></g><g stroke="#F28C0F" stroke-width="2"><path d="M9.6 4.6L12 7l2.4-2.4"/><path d="M9.6 19.4L12 17l2.4 2.4"/></g></svg>',
  recepty: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#14532D" stroke-width="2"><path d="M4.5 11h15v5.5a3.5 3.5 0 0 1-3.5 3.5H8a3.5 3.5 0 0 1-3.5-3.5z"/><path d="M3 11h18"/></g><g stroke="#F28C0F" stroke-width="2"><path d="M9 8c-1-1 1-2 0-3"/><path d="M12 8c-1-1 1-2 0-3"/><path d="M15 8c-1-1 1-2 0-3"/></g></svg>',
}

function recolor(svg: string): string {
  return svg
    .replace(/<title>[^<]*<\/title>/, '')
    .replace(/ width="24" height="24"/, '')
    .replace(/#14532D/gi, 'currentColor')
    .replace(/#F28C0F/gi, 'var(--es-icon-accent)')
}

const icons: Record<string, string> = {}
for (const [path, svg] of Object.entries(rawIcons)) {
  const name = path.split('/').pop()?.replace('.svg', '')
  if (name) icons[name] = recolor(svg)
}
for (const [name, svg] of Object.entries(extraIcons)) icons[name] = recolor(svg)

export function BrandIcon({ name, size = 24, className = '' }: { name: string; size?: number; className?: string }) {
  const svg = icons[name]
  if (!svg) return null
  return <span className={`es-icon ${className}`} style={{ width: size, height: size }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
}
