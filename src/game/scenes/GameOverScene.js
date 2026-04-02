import Phaser from 'phaser'

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' })
  }

  init(data) {
    this.finalScore = data.score || 0
  }

  create() {
    // Dark overlay
    this.add.rectangle(200, 300, 400, 600, 0x000000, 0.7)

    // Game Over text
    this.add.text(200, 180, 'GAME OVER', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#ff6b6b',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Score
    this.add.text(200, 280, 'SCORE', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(200, 320, this.finalScore.toString(), {
      fontSize: '56px',
      fontFamily: 'Arial',
      color: '#ffe66d',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Restart button
    const btnBg = this.add.rectangle(200, 420, 160, 50, 0x4ecdc4)
    const btnText = this.add.text(200, 420, 'PLAY AGAIN', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#1a1a2e',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    btnBg.setInteractive({ useHandCursor: true })

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x3dbdb5)
    })

    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x4ecdc4)
    })

    btnBg.on('pointerdown', () => {
      this.scene.stop('PlayGameScene')
      this.scene.stop('GameOverScene')
      this.scene.start('PlayGameScene')
    })
  }
}
