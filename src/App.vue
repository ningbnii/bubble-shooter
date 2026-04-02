<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { createGame } from './game/index'

const gameContainer = ref(null)
let game = null

onMounted(() => {
  game = createGame()
})

onUnmounted(() => {
  if (game) {
    game.destroy(true)
  }
})
</script>

<template>
  <div class="game-wrapper">
    <div id="game-container" ref="gameContainer"></div>
  </div>
</template>

<style scoped>
.game-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

#game-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
</style>
