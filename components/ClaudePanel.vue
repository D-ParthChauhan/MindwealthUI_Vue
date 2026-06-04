<template>
  <button type="button" class="cbtn" aria-label="AI Analyst" @click="toggle">
    💬
    <div class="nb" :class="{ show: showBadge && !isOpen }" />
  </button>
  <div class="cpanel" :class="{ open: isOpen }">
    <div class="cph">
      <div
        style="width:22px;height:22px;border-radius:5px;background:rgba(201,168,76,0.12);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0"
      >
        💬
      </div>
      <div class="cpt">AI ANALYST</div>
      <div class="cpctx">{{ pageContext }}</div>
      <button
        type="button"
        style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:12px;padding:0 4px"
        aria-label="Close"
        @click="close"
      >
        ✕
      </button>
    </div>
    <div class="cpmsgs">
      <div v-for="msg in messages" :key="msg.id" class="cmw">
        <div class="cmr" :class="{ ag: msg.role === 'agent' }">{{ msg.label }}</div>
        <div class="cmb" :class="{ ag: msg.role === 'agent' }" v-html="msg.html" />
      </div>
    </div>
    <div class="cptav">
      <div class="ld b" style="width:4px;height:4px" />
      TAVILY ACTIVE · INTERNAL DATA PRIORITY · ONCE PER PAGE VISIT
    </div>
    <div class="cpinp">
      <div class="cpii">
        <input
          v-model="draft"
          placeholder="Ask about signals, regime, portfolio..."
          @keydown.enter.prevent="sendMessage"
        />
        <button type="button" class="cpsend" aria-label="Send" :disabled="sending" @click="sendMessage">
          ↑
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  isOpen,
  showBadge,
  messages,
  draft,
  pageContext,
  toggle,
  close,
  sendMessage,
  sending,
} = useClaudePanel()
</script>
