import { useEffect, useState } from 'react'
import { useAppStore } from '../../../stores/appStore'

const POSITIONS = [
  'top-4 left-4',
  'top-4 right-4 text-right',
  'bottom-12 left-4',
  'bottom-12 right-4 text-right',
  'top-1/3 left-1/4',
  'top-1/2 right-1/4 text-right',
]

export function VideoWatermark() {
  const user = useAppStore((s) => s.auth.user)
  const [posIndex, setPosIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPosIndex((prev) => (prev + 1) % POSITIONS.length)
    }, 25000)
    return () => clearInterval(timer)
  }, [])

  if (!user) return null

  const identifier = user.email || user.name || `ID: ${user.id.slice(0, 8)}`
  const posClass = POSITIONS[posIndex]

  return (
    <div
      className={`absolute ${posClass} pointer-events-none select-none z-20 transition-all duration-1000 ease-in-out`}
      aria-hidden="true"
    >
      <div className="rounded px-2 py-0.5 bg-black/20 backdrop-blur-2xs border border-white/5 text-[10px] sm:text-[11px] font-mono text-white/30 tracking-wider">
        {identifier} • Bản quyền bảo lưu
      </div>
    </div>
  )
}
