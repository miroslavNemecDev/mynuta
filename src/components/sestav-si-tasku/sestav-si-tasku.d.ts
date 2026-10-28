export interface BagBuilderState {
  items: { id: string; qty: number }[]
  count: number
  bags: number
  kg: number
  litres: number
  price: number
  lastBagFill: number
}

export interface BagBuilderOptions {
  customerName?: string
  pickupTime?: string
  capacity?: { vol: number; kg: number }
  maxVisible?: number
  initialOrder?: string[]
  demoOrder?: string[]
  showIntro?: boolean
  showDemoButton?: boolean
  note?: string
  onChange?: ((state: BagBuilderState) => void) | null
}

export interface BagBuilder {
  add(id: string): void
  remove(id: string): void
  clear(): void
  playDemo(): void
  getState(): BagBuilderState
  destroy(): void
}

export function mountBagBuilder(root: HTMLElement, options?: BagBuilderOptions): BagBuilder
