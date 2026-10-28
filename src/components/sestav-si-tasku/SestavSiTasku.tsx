import { useEffect, useRef } from 'react'
import './sestav-si-tasku.css'
import { mountBagBuilder, type BagBuilderOptions } from './sestav-si-tasku.js'

type Props = {
  customerName?: string
  pickupTime?: string
  showIntro?: boolean
  showDemoButton?: boolean
  note?: string
}

export default function SestavSiTasku({ customerName = 'Nováková', pickupTime = '17:00', showIntro = true, showDemoButton = true, note }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Undefined hodnoty by přepsaly výchozí nastavení komponenty, proto note přidáváme jen když je zadané.
    const options: BagBuilderOptions = { customerName, pickupTime, showIntro, showDemoButton }
    if (note !== undefined) options.note = note
    const builder = mountBagBuilder(hostRef.current!, options)
    return () => builder.destroy()
  }, [customerName, pickupTime, showIntro, showDemoButton, note])

  return <div ref={hostRef} className="sst-host" />
}
