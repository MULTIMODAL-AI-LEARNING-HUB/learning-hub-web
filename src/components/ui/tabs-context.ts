import { createContext, useContext } from 'react'

export interface TabsContextValue {
  value: string
  onChange: (value: string) => void
}

export const TabsContext = createContext<TabsContextValue | undefined>(undefined)

export function useTabs() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs subcomponents must be used within <Tabs>')
  return ctx
}
