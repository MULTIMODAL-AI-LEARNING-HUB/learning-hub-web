import { useAppStore } from '../../stores/appStore'

export function useToast() {
  return useAppStore((s) => s.toasts.add)
}
