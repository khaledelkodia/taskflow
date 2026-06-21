<template>
  <div class="auth-layout">
    <slot />
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #0f1729 0%, #1a2744 50%, #1e1b4b 100%);
  position: relative;
  overflow: hidden;
}
.auth-layout::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 40%, rgba(37, 99, 235, 0.15), transparent 50%),
              radial-gradient(circle at 70% 60%, rgba(124, 58, 237, 0.1), transparent 50%);
  animation: float 15s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(2%, 1%) rotate(1deg); }
  66% { transform: translate(-1%, 2%) rotate(-1deg); }
}
</style>
