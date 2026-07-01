import { useMediaQuery } from './useMediaQuery'

const BREAKPOINTS = {
  xs: '(max-width: 479px)',
  sm: '(min-width: 480px) and (max-width: 639px)',
  md: '(min-width: 640px) and (max-width: 767px)',
  lg: '(min-width: 768px) and (max-width: 1023px)',
  xl: '(min-width: 1024px) and (max-width: 1279px)',
  '2xl': '(min-width: 1280px) and (max-width: 1535px)',
  '3xl': '(min-width: 1536px)',
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  touch: '(hover: none) and (pointer: coarse)',
  hover: '(hover: hover) and (pointer: fine)',
}

export function useBreakpoint() {
  return {
    isXs: useMediaQuery(BREAKPOINTS.xs),
    isSm: useMediaQuery(BREAKPOINTS.sm),
    isMd: useMediaQuery(BREAKPOINTS.md),
    isLg: useMediaQuery(BREAKPOINTS.lg),
    isXl: useMediaQuery(BREAKPOINTS.xl),
    is2xl: useMediaQuery(BREAKPOINTS['2xl']),
    is3xl: useMediaQuery(BREAKPOINTS['3xl']),
  }
}

export function useIsMobile() {
  return useMediaQuery(BREAKPOINTS.mobile)
}

export function useIsTablet() {
  return useMediaQuery(BREAKPOINTS.tablet)
}

export function useIsDesktop() {
  return useMediaQuery(BREAKPOINTS.desktop)
}

export function useIsTouchDevice() {
  return useMediaQuery(BREAKPOINTS.touch)
}

export function useIsHoverDevice() {
  return useMediaQuery(BREAKPOINTS.hover)
}

export function useResponsive() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()
  const isTouch = useIsTouchDevice()

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    sidebarOpen: isDesktop,
  }
}
