const SVG_NS = 'http://www.w3.org/2000/svg'
const RIM_Y = 205
const SHADOW_BASE_Y = 418
const BAG_BASE_LEFT = 160
const BAG_BASE_RIGHT = 336
const BAG_CENTER_X = (BAG_BASE_LEFT + BAG_BASE_RIGHT) / 2
const TAP_AT = 1900
const PHONE_LOOP_DURATION = 5000
const PHONE_TAP_OFFSET = 1400
const REVEAL_STAGGER = 65
const KICK_DURATION = 170
const ARC_DURATION = 530
const JUMP_DURATION = 720
const IDLE_MOTION_DURATION = 420

type Point = { x: number; y: number }
type FoodPiece = {
  element: SVGGElement
  centerX: number
  centerY: number
  ground: Point
  kick: Point
  peek: Point
  direction: number
}

export type BagIntro = { tapDelayMs: number; stop: () => void }

const mix = (from: number, to: number, amount: number) => from + (to - from) * amount
const easeOut = (amount: number) => 1 - (1 - amount) ** 3
const easeInOut = (amount: number) => amount < 0.5
  ? 4 * amount ** 3
  : 1 - ((-2 * amount + 2) ** 3) / 2

function cubicPoint(start: Point, control1: Point, control2: Point, end: Point, amount: number): Point {
  const inverse = 1 - amount
  return {
    x: inverse ** 3 * start.x + 3 * inverse ** 2 * amount * control1.x + 3 * inverse * amount ** 2 * control2.x + amount ** 3 * end.x,
    y: inverse ** 3 * start.y + 3 * inverse ** 2 * amount * control1.y + 3 * inverse * amount ** 2 * control2.y + amount ** 3 * end.y,
  }
}

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
    const direction = groundCenter < BAG_CENTER_X ? -1 : 1
    const facingEdgeX = direction < 0 ? bounds.x + bounds.width : bounds.x
    const peekEdgeX = Math.max(BAG_BASE_LEFT - 24, Math.min(BAG_BASE_RIGHT + 24, groundCenter + direction * 22))

    return {
      element: wrapper,
      centerX,
      centerY,
      direction,
      ground: { x: groundCenter - facingEdgeX, y: SHADOW_BASE_Y - bounds.y - bounds.height },
      kick: { x: groundCenter + direction * 48 - facingEdgeX, y: SHADOW_BASE_Y - bounds.y - bounds.height - 8 },
      peek: { x: peekEdgeX - facingEdgeX, y: RIM_Y - bounds.y - bounds.height },
    }
  })

  const jumpAt = TAP_AT + (pieces.length - 1) * REVEAL_STAGGER + KICK_DURATION + ARC_DURATION
  const introEnd = jumpAt + JUMP_DURATION
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
      const revealTime = elapsed - TAP_AT - index * REVEAL_STAGGER
      if (revealTime < 0) {
        place(piece, piece.ground, 0)
        return
      }

      if (revealTime < KICK_DURATION) {
        const progress = easeOut(revealTime / KICK_DURATION)
        place(piece, {
          x: mix(piece.ground.x, piece.kick.x, progress),
          y: mix(piece.ground.y, piece.kick.y, progress),
        }, progress)
        return
      }

      const arcTime = revealTime - KICK_DURATION
      if (arcTime < ARC_DURATION) {
        const progress = easeInOut(arcTime / ARC_DURATION)
        const control1 = { x: piece.kick.x + piece.direction * 34, y: piece.kick.y - 118 }
        const control2 = { x: piece.peek.x - piece.direction * 44, y: piece.peek.y - 46 }
        place(piece, cubicPoint(piece.kick, control1, control2, piece.peek, progress), 1)
        return
      }

      const jumpTime = arcTime - ARC_DURATION

      if (jumpTime < JUMP_DURATION) {
        const progress = easeInOut(jumpTime / JUMP_DURATION)
        const control1 = { x: piece.peek.x - piece.direction * 72, y: piece.peek.y - 118 }
        const control2 = { x: piece.direction * 34, y: -92 }
        place(piece, cubicPoint(piece.peek, control1, control2, { x: 0, y: 0 }, progress), 1, piece.direction * (1 - progress) * -4)
        return
      }

      const idleTime = elapsed - repeatTapAt - index * 28
      if (completed && idleTime >= 0) {
        const pulseTime = idleTime % PHONE_LOOP_DURATION
        if (pulseTime < IDLE_MOTION_DURATION) {
          const amount = Math.sin((pulseTime / IDLE_MOTION_DURATION) * Math.PI)
          place(piece, { x: piece.direction * amount * 1.4, y: -amount * 1.8 }, 1, piece.direction * amount * 0.8)
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