<script setup lang="ts">
import { WifiOff } from 'lucide-vue-next'
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { isOnline } = useNetworkStatus()
</script>

<template>
  <div
    v-if="!isOnline"
    class="bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all duration-300 z-50 sticky top-0"
  >
    <WifiOff class="w-4 h-4 animate-pulse" />
    <span>Você está offline. As alterações locais estão seguras e serão sincronizadas quando reconectar.</span>
  </div>
</template>
