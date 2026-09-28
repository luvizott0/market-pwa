<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'
import OfflineIndicator from '@/components/layout/OfflineIndicator.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isAuthPage = computed(() => route.meta.requiresAuth === false || route.name === 'login')

const handleUnauthorized = () => {
  authStore.clearAuth()
  router.push({ name: 'login' })
}

onMounted(async () => {
  window.addEventListener('market:unauthorized', handleUnauthorized)
  window.addEventListener('flux:unauthorized', handleUnauthorized)

  if (authStore.token) {
    await authStore.ensureAuthenticated()
  }
})

onUnmounted(() => {
  window.removeEventListener('market:unauthorized', handleUnauthorized)
  window.removeEventListener('flux:unauthorized', handleUnauthorized)
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
    <!-- Offline Indicator Status Bar -->
    <OfflineIndicator />

    <!-- Protected Application Shell -->
    <template v-if="!isAuthPage">
      <div class="flex-1 flex w-full">
        <!-- Desktop Sidebar -->
        <AppSidebar />

        <!-- Main Body Area -->
        <div class="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main class="flex-1 min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 max-w-6xl w-full mx-auto">
            <RouterView />
          </main>
        </div>
      </div>

      <!-- Mobile Bottom Navigation Bar (PWA 3 Tabs) -->
      <MobileBottomNav />
    </template>

    <!-- Guest / Login Layout -->
    <template v-else>
      <main class="flex-1 flex items-center justify-center p-4 sm:p-6">
        <RouterView />
      </main>
    </template>
  </div>
</template>
