<template>
  <UiModal
    :model-value="state.open"
    :title="state.title || $t('common.confirmTitle', 'Please confirm')"
    max-width="sm"
    @update:model-value="(v: boolean) => { if (!v) respond(false) }"
  >
    <p class="text-sm text-content-secondary leading-relaxed">{{ state.message }}</p>

    <template #footer>
      <UiButton variant="secondary" @click="respond(false)">
        {{ state.cancelText || $t('common.cancel', 'Cancel') }}
      </UiButton>
      <UiButton :variant="state.variant" @click="respond(true)">
        {{ state.confirmText || $t('common.confirm', 'Confirm') }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
const { state, respond } = useConfirm()
</script>
