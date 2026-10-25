const SVG_NS = 'http://www.w3.org/2000/svg'
const PHONE_TAP_DELAY = 500
const PHONE_TAP_OFFSET = 1400
const PHONE_LOOP_DURATION = 5000
const ITEM_STAGGER = 38
const BOUNCE_DURATION = 520
const BOUNCE_HEIGHT = 15

type FoodPiece = {
  wrapper: SVGGElement
  centerX: number
  centerY: number
}

export type BagIntro = { tapDelayMs: number; stop: () => void }

/** Keep the bag filled and bounce its contents in time with the phone tap. */
export function playBagIntro(mount: HTMLElement, onPhoneTap: () => void): BagIntro {
  const svg = mount.querySelector('svg')
  const clipGroup = svg?.querySelector<SVGGElement>('g[clip-path]')
  if (!svg || !clipGroup) {
    return { tapDelayMs: 0, stop() {} }
  }

  const pieces: FoodPiece[] = (Array.from(clipGroup.children) as SVGGElement[]).map((child) => {
    const wrapper = document.createElementNS(SVG_NS, 'g')
    clipGroup.insertBefore(wrapper, child)
    wrapper.appendChild(child)
    const bounds = wrapper.getBBox()

    return {
      wrapper,
      centerX: bounds.x + bounds.width / 2,
      centerY: bounds.y + bounds.height / 2,
    }
  })

  const firstTapAt = PHONE_TAP_DELAY + PHONE_TAP_OFFSET
  const startedAt = performance.now()
  let frame = 0
  let lastPhoneTapCycle = 0

  const tick = (now: number) => {
    const elapsed = now - startedAt

    if (elapsed >= firstTapAt) {
      const phoneTapCycle = Math.floor((elapsed - firstTapAt) / PHONE_LOOP_DURATION) + 1
      if (phoneTapCycle > lastPhoneTapCycle) {
        lastPhoneTapCycle = phoneTapCycle
        onPhoneTap()
      }

      pieces.forEach((piece, index) => {
        const cycleElapsed = (elapsed - firstTapAt) % PHONE_LOOP_DURATION
        const bounceTime = cycleElapsed - index * ITEM_STAGGER
        if (bounceTime < 0 || bounceTime >= BOUNCE_DURATION) {
          piece.wrapper.removeAttribute('transform')
          return
        }

        const progress = bounceTime / BOUNCE_DURATION
        const bounce = Math.sin(progress * Math.PI)
        const angle = bounce * (index % 2 === 0 ? -2.5 : 2.5)
        piece.wrapper.setAttribute(
          'transform',
          `translate(0 ${-bounce * BOUNCE_HEIGHT}) rotate(${angle} ${piece.centerX} ${piece.centerY})`,
        )
      })
    }

    frame = window.requestAnimationFrame(tick)
  }

  frame = window.requestAnimationFrame(tick)

  return {
    tapDelayMs: PHONE_TAP_DELAY,
    stop() {
      window.cancelAnimationFrame(frame)
      pieces.forEach(({ wrapper }) => {
        const child = wrapper.firstChild
        if (child) clipGroup.insertBefore(child, wrapper)
        wrapper.remove()
      })
    },
  }
}
