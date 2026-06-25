<template>
  <Teleport to="body">
    <Transition name="img-pop">
      <div v-if="open" class="img-pop-root" role="presentation">
        <div class="img-pop-backdrop" aria-hidden="true" @click="close" />
        <div class="img-pop-card" role="dialog" :aria-label="title">
          <div class="img-pop-head">
            <span class="img-pop-title">{{ title }}</span>
            <button type="button" class="img-pop-close" aria-label="Close" @click="close">×</button>
          </div>
          <div class="img-pop-body">
            <img :src="src" :alt="title" class="img-pop-img" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  src: string
}>()

const emit = defineEmits<{
  close: []
}>()

function close() {
  emit('close')
}
</script>

<style scoped>
.img-pop-root {
  position: fixed;
  inset: 0;
  z-index: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.img-pop-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
}
.img-pop-card {
  position: relative;
  width: min(920px, 100%);
  max-height: min(92vh, 900px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--s1);
  border: 1px solid var(--b2);
  border-radius: 6px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.65);
}
.img-pop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b2);
  background: var(--s2);
  flex-shrink: 0;
}
.img-pop-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--gold);
  text-transform: uppercase;
}
.img-pop-close {
  background: none;
  border: none;
  color: var(--t3);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0 4px;
  border-radius: 3px;
}
.img-pop-close:hover {
  color: var(--t2);
  background: var(--s1);
}
.img-pop-body {
  overflow: auto;
  padding: 12px;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
.img-pop-img {
  display: block;
  max-width: 100%;
  max-height: min(80vh, 780px);
  width: auto;
  height: auto;
  object-fit: contain;
}
.img-pop-enter-active,
.img-pop-leave-active {
  transition: opacity 0.18s ease;
}
.img-pop-enter-active .img-pop-card,
.img-pop-leave-active .img-pop-card {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.img-pop-enter-from,
.img-pop-leave-to {
  opacity: 0;
}
.img-pop-enter-from .img-pop-card,
.img-pop-leave-to .img-pop-card {
  transform: translateY(8px) scale(0.98);
  opacity: 0;
}
</style>
