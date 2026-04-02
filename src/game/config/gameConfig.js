import Phaser from 'phaser'

export default {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 400,
  height: 600,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: []
}
