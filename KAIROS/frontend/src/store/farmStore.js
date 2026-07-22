import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useFarmStore = create(
  persist(
    (set, get) => ({
      farms: [],
      selectedFarm: null,
      loading: false,
      analysisData: null,
      analysisLoading: false,

      setFarms: (farms) => set({ farms }),
      setSelectedFarm: (farm) => {
        set({ selectedFarm: farm })
        if (farm?.id) {
          get().fetchAnalysis(farm.id)
        }
      },
      addFarm: (farm) => set((state) => ({ farms: [...state.farms, farm] })),
      updateFarm: (id, data) => set((state) => ({
        farms: state.farms.map(f => f.id === id ? { ...f, ...data } : f),
        selectedFarm: state.selectedFarm?.id === id ? { ...state.selectedFarm, ...data } : state.selectedFarm,
      })),
      removeFarm: (id) => set((state) => ({
        farms: state.farms.filter(f => f.id !== id),
        selectedFarm: state.selectedFarm?.id === id ? (state.farms[0] || null) : state.selectedFarm,
      })),
      setLoading: (loading) => set({ loading }),
      
      fetchAnalysis: async (farmId, silent = false) => {
        if (!silent) set({ analysisLoading: true })
        try {
          const { dashboardAPI } = await import('@/services/api')
          const res = await dashboardAPI.get(farmId)
          if (res.data.needs_run) {
            // No analysis exists, run one now
            await get().runAnalysis(farmId, silent)
          } else {
            set({ analysisData: res.data })
          }
        } catch (error) {
          console.error('Failed to fetch analysis', error)
        } finally {
          if (!silent) set({ analysisLoading: false })
        }
      },
      
      runAnalysis: async (farmId, silent = false, file = null) => {
        if (!silent) set({ analysisLoading: true })
        try {
          const { analysisAPI } = await import('@/services/api')
          const res = await analysisAPI.run(farmId, file)
          set({ analysisData: res.data })
          return res.data;
        } catch (error) {
          console.error('Failed to run analysis', error)
          throw error;
        } finally {
          if (!silent) set({ analysisLoading: false })
        }
      },
    }),
    {
      name: 'kairos-farms',
      partialize: (state) => ({ farms: state.farms, selectedFarm: state.selectedFarm }),
    }
  )
)

export const useThemeStore = create(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => set((state) => {
        const newDark = !state.isDark
        document.documentElement.classList.toggle('dark', newDark)
        return { isDark: newDark }
      }),
      initTheme: () => {
        const { isDark } = useThemeStore.getState()
        document.documentElement.classList.toggle('dark', isDark)
      },
    }),
    { name: 'kairos-theme' }
  )
)
