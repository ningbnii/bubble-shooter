import Phaser from 'phaser'

const BUBBLE_COLORS = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181, 0xaa96da]
const BUBBLE_SIZE = 32
const GRID_COLS = 11
const GRID_ROWS = 20  // Increased to allow bubbles to grow higher
const GRID_OFFSET_X = 20
const GRID_OFFSET_Y = 50
const DANGER_LINE_Y = 480  // Game over if bubbles go below this line

export default class PlayGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayGameScene' })
    this.grid = []
    this.currentBubble = null
    this.nextBubble = null
    this.aimLine = null
    this.canShoot = true
    this.score = 0
    this.bubbleVelocity = { x: 0, y: 0 }
    this.moveTimer = null
    this.shooterBubbleColor = null
    /** Set each shot: origin + unit direction from launcher (aim line). */
    this._shotOriginX = 200
    this._shotOriginY = 560
    this._shotDirX = 0
    this._shotDirY = -1
  }

  create() {
    this.score = 0
    this.canShoot = false  // Disable shooting briefly at start
    this.moveTimer = null
    this.createBubbleTextures()
    this.createGrid()
    this.createShooter()
    this.createAimLine()
    this.createUI()

    this.input.on('pointermove', (ptr) => this.updateAimLine(ptr))
    this.input.on('pointerdown', (ptr) => this.shootBubble(ptr))

    // Re-enable shooting after a brief delay
    this.time.delayedCall(100, () => {
      this.canShoot = true
    })
  }

  createBubbleTextures() {
    BUBBLE_COLORS.forEach(color => {
      const graphics = this.make.graphics({ x: 0, y: 0 })
      graphics.fillStyle(color, 1)
      graphics.fillCircle(BUBBLE_SIZE / 2, BUBBLE_SIZE / 2, BUBBLE_SIZE / 2 - 2)
      graphics.fillStyle(0xffffff, 0.3)
      graphics.fillCircle(BUBBLE_SIZE / 3, BUBBLE_SIZE / 3, BUBBLE_SIZE / 6)
      graphics.generateTexture('bubble_' + color, BUBBLE_SIZE, BUBBLE_SIZE)
      graphics.destroy()
    })
  }

  createGrid() {
    this.grid = []
    for (let row = 0; row < GRID_ROWS; row++) {
      this.grid[row] = []
      const maxCol = this.maxColForRow(row)
      for (let col = 0; col < GRID_COLS; col++) {
        this.grid[row][col] = null
      }
      for (let col = 0; col <= maxCol; col++) {
        if (row < 5) {
          const color = Phaser.Math.RND.pick(BUBBLE_COLORS)
          const bubble = this.addBubble(col, row, color)
          this.grid[row][col] = bubble
        }
      }
    }
  }

  addBubble(col, row, color) {
    const offsetX = row % 2 === 1 ? BUBBLE_SIZE / 2 : 0
    const x = GRID_OFFSET_X + col * BUBBLE_SIZE + BUBBLE_SIZE / 2 + offsetX
    const y = GRID_OFFSET_Y + row * (BUBBLE_SIZE * 0.866) + BUBBLE_SIZE / 2

    const bubble = this.add.image(x, y, 'bubble_' + color)
    bubble.setData('color', color)
    bubble.setData('gridRow', row)
    bubble.setData('gridCol', col)
    bubble.setScale(0.9)
    return bubble
  }

  createShooter() {
    const baseX = 200
    const baseY = 560

    this.add.circle(baseX, baseY, 30, 0x2d3436)

    this.shooterBubbleColor = Phaser.Math.RND.pick(BUBBLE_COLORS)
    this.currentBubble = this.add.image(baseX, baseY, 'bubble_' + this.shooterBubbleColor)
    this.currentBubble.setScale(0.9)
    this.currentBubble.setData('color', this.shooterBubbleColor)

    const nextColor = Phaser.Math.RND.pick(BUBBLE_COLORS)
    this.nextBubble = this.add.image(140, baseY, 'bubble_' + nextColor)
    this.nextBubble.setAlpha(0.6)
  }

  createAimLine() {
    this.aimLine = this.add.graphics()
    this.aimLine.setDepth(-1)
  }

  updateAimLine(pointer) {
    this.aimLine.clear()
    if (!this.currentBubble) return

    const baseX = 200
    const baseY = 560
    const angle = Phaser.Math.Angle.Between(baseX, baseY, pointer.x, pointer.y)

    if (pointer.y < baseY) {
      const targetAngle = Phaser.Math.Clamp(angle, -Math.PI + 0.2, -0.2)

      this.aimLine.lineStyle(2, 0xffffff, 0.5)

      for (let i = 0; i < 300; i += 10) {
        const x = baseX + Math.cos(targetAngle) * i
        const y = baseY + Math.sin(targetAngle) * i

        if (y < GRID_OFFSET_Y) break

        if (i % 20 === 0) {
          this.aimLine.fillStyle(0xffffff, 0.5)
          this.aimLine.fillCircle(x, y, 3)
        }
      }

      this.currentBubble.setAngle(Phaser.Math.RadToDeg(targetAngle) + 90)
    }
  }

  shootBubble(pointer) {
    if (!this.canShoot || !this.currentBubble) return

    const baseX = 200
    const baseY = 560
    const angle = Phaser.Math.Angle.Between(baseX, baseY, pointer.x, pointer.y)

    if (pointer.y >= baseY) return

    this.canShoot = false
    this.aimLine.clear()
    this.currentBubble.setAngle(0)

    const speed = 800
    this.bubbleVelocity.x = Math.cos(angle) * speed
    this.bubbleVelocity.y = Math.sin(angle) * speed

    this._shotOriginX = baseX
    this._shotOriginY = baseY
    this._shotDirX = Math.cos(angle)
    this._shotDirY = Math.sin(angle)

    this.moveTimer = this.time.addEvent({
      delay: 16,
      callback: this.updateMovingBubble,
      callbackScope: this,
      loop: true
    })
  }

  updateMovingBubble() {
    if (!this.currentBubble || !this.moveTimer) return

    this.currentBubble.x += this.bubbleVelocity.x * 0.016
    this.currentBubble.y += this.bubbleVelocity.y * 0.016

    // Wall bounce
    if (this.currentBubble.x < BUBBLE_SIZE / 2) {
      this.currentBubble.x = BUBBLE_SIZE / 2
      this.bubbleVelocity.x *= -1
    }
    if (this.currentBubble.x > 400 - BUBBLE_SIZE / 2) {
      this.currentBubble.x = 400 - BUBBLE_SIZE / 2
      this.bubbleVelocity.x *= -1
    }

    // Top collision
    if (this.currentBubble.y < GRID_OFFSET_Y + BUBBLE_SIZE / 2) {
      this.currentBubble.y = GRID_OFFSET_Y + BUBBLE_SIZE / 2
      this.placeBubble(null, null)
      return
    }

    // Grid collision: among overlapping bubbles, attach to the one *closest to the
    // current movement direction* (smallest rayT along velocity direction)
    const px = this.currentBubble.x
    const py = this.currentBubble.y
    const hitR = BUBBLE_SIZE * 0.9

    // Use current velocity direction for rayT calculation
    const speed = Math.sqrt(this.bubbleVelocity.x ** 2 + this.bubbleVelocity.y ** 2)
    const ndx = this.bubbleVelocity.x / speed
    const ndy = this.bubbleVelocity.y / speed

    const inRange = []
    for (let row = 0; row < GRID_ROWS; row++) {
      const cols = row % 2 === 1 ? GRID_COLS - 1 : GRID_COLS
      for (let col = 0; col < cols; col++) {
        if (this.grid[row] && this.grid[row][col]) {
          const bubble = this.grid[row][col]
          const dist = Phaser.Math.Distance.Between(px, py, bubble.x, bubble.y)
          if (dist < hitR) {
            // Project along current velocity direction
            const rayT = (bubble.x - px) * ndx + (bubble.y - py) * ndy
            inRange.push({ row, col, dist, rayT })
          }
        }
      }
    }
    if (inRange.length === 0) return

    // Pick bubbles that are ahead or just past the collision point
    // rayT >= -1 catches collisions that happened in the last frame
    const ahead = inRange.filter((c) => c.rayT >= -1)
    if (ahead.length === 0) {
      // No valid target, keep moving
      return
    }

    ahead.sort((a, b) => a.rayT - b.rayT)
    this.placeBubble(ahead[0].row, ahead[0].col)
  }

  maxColForRow(row) {
    return row % 2 === 1 ? GRID_COLS - 2 : GRID_COLS - 1
  }

  isValidCell(row, col) {
    if (row < 0 || row >= GRID_ROWS || col < 0) return false
    return col <= this.maxColForRow(row)
  }

  placeBubble(hitRow, hitCol) {
    if (this.moveTimer) {
      this.moveTimer.remove()
      this.moveTimer = null
    }

    const color = this.shooterBubbleColor
    let bestRow = 0
    let bestCol = 0
    let bestDist = Infinity

    const px = this.currentBubble.x
    const py = this.currentBubble.y
    const sx = this._shotOriginX
    const sy = this._shotOriginY
    const sdx = this._shotDirX
    const sdy = this._shotDirY

    const cellCenter = (row, col) => {
      const ox = row % 2 === 1 ? BUBBLE_SIZE / 2 : 0
      const cx = GRID_OFFSET_X + col * BUBBLE_SIZE + BUBBLE_SIZE / 2 + ox
      const cy = GRID_OFFSET_Y + row * (BUBBLE_SIZE * 0.866) + BUBBLE_SIZE / 2
      return { cx, cy }
    }

    const distToShot = (row, col) => {
      const { cx, cy } = cellCenter(row, col)
      return Phaser.Math.Distance.Between(px, py, cx, cy)
    }

    /** Distance along original aim ray from launcher; smaller = closer to player along aim. */
    const alongRayFromLauncher = (row, col) => {
      const { cx, cy } = cellCenter(row, col)
      return (cx - sx) * sdx + (cy - sy) * sdy
    }

    /** Prefer empty cells adjacent to the bubble we collided with (or top row if ceiling hit). */
    const candidates = []
    if (hitRow != null && hitCol != null) {
      for (const [nr, nc] of this.getNeighbors(hitRow, hitCol)) {
        if (!this.isValidCell(nr, nc)) continue
        if (!this.grid[nr]) continue
        if (this.grid[nr][nc]) continue
        candidates.push([nr, nc])
      }
    } else {
      for (let col = 0; col < GRID_COLS; col++) {
        if (this.grid[0] && this.grid[0][col]) continue
        candidates.push([0, col])
      }
    }

    if (candidates.length > 0) {
      // Simply pick the candidate closest to the collision point
      let minDist = Infinity
      for (const [row, col] of candidates) {
        const { cx, cy } = cellCenter(row, col)
        const d = Phaser.Math.Distance.Between(px, py, cx, cy)
        if (d < minDist) {
          minDist = d
          bestRow = row
          bestCol = col
        }
      }
    } else {
      for (let row = 0; row < GRID_ROWS; row++) {
        const cols = row % 2 === 1 ? GRID_COLS - 1 : GRID_COLS
        for (let col = 0; col < cols; col++) {
          if (this.grid[row] && this.grid[row][col]) continue
          const d = distToShot(row, col)
          if (d < bestDist) {
            bestDist = d
            bestRow = row
            bestCol = col
          }
        }
      }
    }

    // Place bubble at best position
    const offsetX = bestRow % 2 === 1 ? BUBBLE_SIZE / 2 : 0
    const x = GRID_OFFSET_X + bestCol * BUBBLE_SIZE + BUBBLE_SIZE / 2 + offsetX
    const y = GRID_OFFSET_Y + bestRow * (BUBBLE_SIZE * 0.866) + BUBBLE_SIZE / 2

    this.currentBubble.setPosition(x, y)
    this.currentBubble.setData('color', color)
    this.currentBubble.setData('gridRow', bestRow)
    this.currentBubble.setData('gridCol', bestCol)

    if (!this.grid[bestRow]) this.grid[bestRow] = []
    this.grid[bestRow][bestCol] = this.currentBubble

    // Check if placed bubble is below danger line - game over!
    const placedY = GRID_OFFSET_Y + bestRow * (BUBBLE_SIZE * 0.866) + BUBBLE_SIZE / 2
    if (placedY > DANGER_LINE_Y) {
      this.time.delayedCall(300, () => {
        this.scene.start('GameOverScene', { score: this.score })
      })
      return
    }

    // Check matches
    const matches = this.findMatches(bestRow, bestCol, color)
    if (matches.length >= 3) {
      this.popBubbles(matches)
    }

    // Reset shooter for next bubble - delay to allow animations
    this.time.delayedCall(400, () => {
      this.resetShooter()
    })
  }

  resetShooter() {
    const baseX = 200
    const baseY = 560

    // Destroy old currentBubble if it exists (should be in grid now)
    // Create new currentBubble at shooter position
    const color = Phaser.Math.RND.pick(BUBBLE_COLORS)
    this.currentBubble = this.add.image(baseX, baseY, 'bubble_' + color)
    this.currentBubble.setScale(0.9)
    this.currentBubble.setData('color', color)
    this.shooterBubbleColor = color

    // Update nextBubble appearance
    const nextColor = Phaser.Math.RND.pick(BUBBLE_COLORS)
    this.nextBubble.setTexture('bubble_' + nextColor)
    this.nextBubble.setPosition(140, baseY)
    this.nextBubble.setAlpha(0.6)

    this.canShoot = true
    this.checkGameOver()
  }

  findMatches(row, col, color) {
    const matches = []
    const visited = new Set()
    const stack = [[row, col]]

    while (stack.length > 0) {
      const [r, c] = stack.pop()
      const key = `${r},${c}`

      if (visited.has(key)) continue
      visited.add(key)

      if (!this.grid[r] || !this.grid[r][c]) {
        continue
      }

      const bubbleColor = this.grid[r][c].getData('color')

      if (bubbleColor !== color) continue

      matches.push({ row: r, col: c })

      const neighbors = this.getNeighbors(r, c)
      for (const [nr, nc] of neighbors) {
        if (!visited.has(`${nr},${nc}`)) {
          stack.push([nr, nc])
        }
      }
    }

    return matches
  }

  getNeighbors(row, col) {
    const neighbors = []
    const isOddRow = row % 2 === 1

    neighbors.push([row, col - 1])
    neighbors.push([row, col + 1])

    if (isOddRow) {
      neighbors.push([row - 1, col])
      neighbors.push([row - 1, col + 1])
      neighbors.push([row + 1, col])
      neighbors.push([row + 1, col + 1])
    } else {
      neighbors.push([row - 1, col - 1])
      neighbors.push([row - 1, col])
      neighbors.push([row + 1, col - 1])
      neighbors.push([row + 1, col])
    }

    return neighbors.filter(([r, c]) => this.isValidCell(r, c))
  }

  popBubbles(matches) {
    this.score += matches.length * 10

    for (const { row, col } of matches) {
      const bubble = this.grid[row][col]
      if (bubble) {
        this.tweens.add({
          targets: bubble,
          scale: 0,
          alpha: 0,
          duration: 200,
          ease: 'Back.ease',
          onComplete: () => bubble.destroy()
        })
        this.grid[row][col] = null
      }
    }

    this.updateScoreDisplay()
    this.removeFloatingBubbles()
  }

  removeFloatingBubbles() {
    const connected = new Set()

    const topMaxCol = this.maxColForRow(0)
    for (let col = 0; col <= topMaxCol; col++) {
      if (this.grid[0] && this.grid[0][col]) {
        this.markConnected(0, col, connected)
      }
    }

    for (let row = 0; row < GRID_ROWS; row++) {
      const maxCol = this.maxColForRow(row)
      for (let col = 0; col <= maxCol; col++) {
        if (this.grid[row] && this.grid[row][col]) {
          const key = `${row},${col}`
          if (!connected.has(key)) {
            const bubble = this.grid[row][col]
            this.tweens.add({
              targets: bubble,
              y: bubble.y + 200,
              alpha: 0,
              duration: 500,
              ease: 'Bounce.easeOut',
              onComplete: () => bubble.destroy()
            })
            this.grid[row][col] = null
            this.score += 20
          }
        }
      }
    }

    this.updateScoreDisplay()
  }

  markConnected(row, col, connected) {
    const stack = [[row, col]]

    while (stack.length > 0) {
      const [r, c] = stack.pop()
      const key = `${r},${c}`

      if (connected.has(key)) continue
      if (!this.grid[r] || !this.grid[r][c]) continue

      connected.add(key)

      const neighbors = this.getNeighbors(r, c)
      for (const [nr, nc] of neighbors) {
        if (!connected.has(`${nr},${nc}`)) {
          stack.push([nr, nc])
        }
      }
    }
  }

  createUI() {
    // Danger line
    const dangerGraphics = this.add.graphics()
    dangerGraphics.lineStyle(2, 0xff0000, 0.8)
    dangerGraphics.lineBetween(10, DANGER_LINE_Y, 390, DANGER_LINE_Y)
    // Add dashed pattern
    for (let x = 10; x < 390; x += 20) {
      dangerGraphics.fillStyle(0xff0000, 0.8)
      dangerGraphics.fillRect(x, DANGER_LINE_Y - 1, 10, 2)
    }

    this.add.text(20, 10, 'SCORE: 0', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setName('scoreText')

    this.add.text(280, 10, 'BUBBLE\nSHOOTER', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#aaaaaa',
      align: 'center'
    })
  }

  updateScoreDisplay() {
    const scoreText = this.children.getByName('scoreText')
    if (scoreText) {
      scoreText.setText('SCORE: ' + this.score)
    }
  }

  checkGameOver() {
    for (let row = 0; row < GRID_ROWS; row++) {
      const maxCol = this.maxColForRow(row)
      for (let col = 0; col <= maxCol; col++) {
        if (this.grid[row] && this.grid[row][col]) {
          const bubble = this.grid[row][col]
          if (bubble.y > DANGER_LINE_Y) {
            this.scene.start('GameOverScene', { score: this.score })
            return
          }
        }
      }
    }
  }
}
