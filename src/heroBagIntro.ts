const SVG_NS = 'http://www.w3.org/2000/svg'
const SHADOW_BASE_Y = 418
const BAG_BASE_LEFT = 160
const BAG_BASE_RIGHT = 336
const TAP_AT = 1900
const PHONE_LOOP_DURATION = 5000
const PHONE_TAP_OFFSET = 1400
const FLIGHT_STAGGER = 38
const FLIGHT_DURATION = 520
const FLIGHT_HEIGHT = 88
const IDLE_MOTION_DURATION = 420

type Point = { x: number; y: number }
type FoodPiece = {
  element: SVGGElement
  centerX: number
  centerY: number
  ground: Point
}

export type BagIntro = { tapDelayMs: number; stop: () => void }

const mix = (from: number, to: number, amount: number) => from + (to - from) * amount
const easeOut = (amount: number) => 1 - (1 - amount) ** 3

/** Run the one-shot bag fill and keep later phone taps to a quiet food-item wiggle. */
export function playBagIntro(mount: HTMLElement, onDone: () => void, onPhoneTap: () => void): BagIntro {
  const svg = mount.querySelector('svg')
  const clipGroup = svg?.querySelector<SVGGElement>('g[clip-path]')
  if (!svg || !clipGroup) {
    onDone()
    return { tapDelayMs: 0, stop() {} }
  }

  const clipValue = clipGroup.getAttribute('clip-path') ?? ''
  const children = Array.from(clipGroup.children) as SVGGElement[]
  const pieces: FoodPiece[] = children.map((child, index) => {
    const wrapper = document.createElementNS(SVG_NS, 'g')
    clipGroup.insertBefore(wrapper, child)
    wrapper.appendChild(child)
    const bounds = wrapper.getBBox()
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    const groundCenter = BAG_BASE_LEFT + (index / Math.max(1, children.length - 1)) * (BAG_BASE_RIGHT - BAG_BASE_LEFT)

    return {
      element: wrapper,
      centerX,
      centerY,
      ground: { x: groundCenter - centerX, y: SHADOW_BASE_Y - bounds.y - bounds.height },
    }
  })

  const introEnd = TAP_AT + (pieces.length - 1) * FLIGHT_STAGGER + FLIGHT_DURATION
  const repeatTapAt = TAP_AT + PHONE_LOOP_DURATION
  const startedAt = performance.now()
  let frame = 0
  let revealed = false
  let completed = false
  let lastPhoneTapCycle = 0

  const place = (piece: FoodPiece, point: Point, opacity = 1, angle = 0) => {
    piece.element.style.opacity = String(opacity)
    piece.element.setAttribute(
      'transform',
      `translate(${point.x} ${point.y}) rotate(${angle} ${piece.centerX} ${piece.centerY})`,
    )
  }

  pieces.forEach((piece) => place(piece, piece.ground, 0))

  const tick = (now: number) => {
    const elapsed = now - startedAt
    if (elapsed >= TAP_AT && !revealed) {
      clipGroup.removeAttribute('clip-path')
      revealed = true
    }

    pieces.forEach((piece, index) => {
      const revealTime = elapsed - TAP_AT - index * FLIGHT_STAGGER
      if (revealTime < 0) {
        place(piece, piece.ground, 0)
        return
      }

      if (revealTime < FLIGHT_DURATION) {
        const progress = revealTime / FLIGHT_DURATION
        const eased = easeOut(progress)
        const arc = Math.sin(progress * Math.PI) * FLIGHT_HEIGHT
        const angle = Math.sin(progress * Math.PI) * (index % 2 === 0 ? -8 : 8)
        place(piece, {
          x: mix(piece.ground.x, 0, eased),
          y: mix(piece.ground.y, 0, eased) - arc,
        }, Math.min(1, revealTime / 70), angle)
        return
      }

      const idleTime = elapsed - repeatTapAt - index * 28
      if (completed && idleTime >= 0) {
        const pulseTime = idleTime % PHONE_LOOP_DURATION
        if (pulseTime < IDLE_MOTION_DURATION) {
          const amount = Math.sin((pulseTime / IDLE_MOTION_DURATION) * Math.PI)
          place(piece, { x: amount * 1.4, y: -amount * 1.8 }, 1, amount * 0.8)
          return
        }
      }

      place(piece, { x: 0, y: 0 })
    })

    if (!completed && elapsed >= introEnd) {
      clipGroup.setAttribute('clip-path', clipValue)
      completed = true
      onDone()
    }
    if (completed && elapsed >= repeatTapAt) {
      const phoneTapCycle = Math.floor((elapsed - repeatTapAt) / PHONE_LOOP_DURATION) + 1
      if (phoneTapCycle > lastPhoneTapCycle) {
        lastPhoneTapCycle = phoneTapCycle
        onPhoneTap()
      }
    }
    frame = window.requestAnimationFrame(tick)
  }

  frame = window.requestAnimationFrame(tick)

  return {
    tapDelayMs: Math.max(0, TAP_AT - PHONE_TAP_OFFSET),
    stop() {
      window.cancelAnimationFrame(frame)
      clipGroup.setAttribute('clip-path', clipValue)
    },
  }
}