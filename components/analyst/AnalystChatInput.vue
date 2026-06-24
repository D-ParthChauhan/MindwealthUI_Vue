<template>
  <div class="ach-input-wrap">
    <div class="ach-input-card">
      <textarea
        ref="textareaRef"
        :value="modelValue"
        class="ach-textarea"
        rows="1"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="onInput"
        @keydown="onKeydown"
      />
      <button
        type="button"
        class="ach-send"
        :disabled="disabled || !modelValue.trim()"
        aria-label="Send message"
        @click="$emit('send')"
      >
        <span v-if="disabled" class="ach-send-spin" />
        <span v-else>↑</span>
      </button>
    </div>
    <div class="ach-input-hint">Enter to send · Shift+Enter for new line</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  send: []
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

defineExpose({ focus: () => textareaRef.value?.focus() })

function resize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
}

function onInput(e: Event) {
  const value = (e.target as HTMLTextAreaElement).value
  emit('update:modelValue', value)
  resize()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (!props.disabled && props.modelValue.trim()) emit('send')
  }
}

watch(
  () => props.modelValue,
  () => nextTick(resize),
)

onMounted(() => nextTick(resize))
</script>
