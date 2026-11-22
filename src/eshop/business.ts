// Údaje o provozovateli na jednom místě: patička, kontakt i podmínky je berou odsud.
// null = zatím neznámé, na webu se ukáže „doplním před spuštěním“. Nic z toho nevymýšlet.
export const BUSINESS = {
  brand: 'Mynuta',
  operator: 'Miroslav Němec',
  ico: null as string | null,
  seat: null as string | null,
  pickupAddress: null as string | null,
  area: 'Plzeň-Slovany',
  email: 'info@mynuta.cz',
  phone: null as string | null,
  hours: [['Po–Pá', '8–20'], ['So', '9–12'], ['Ne', 'zavřeno']] as const,
}

export const MISSING = 'doplním před spuštěním'

export function orMissing(value: string | null): string {
  return value ?? MISSING
}
