import Phaser from 'phaser'
import PlayGameScene from './scenes/PlayGameScene'
import GameOverScene from './scenes/GameOverScene'

const config = {
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
  scene: [PlayGameScene, GameOverScene]
}

export function createGame() {
  return new Phaser.Game(config)
}
