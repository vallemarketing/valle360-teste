"use client"

import { memo, useEffect, useLayoutEffect, useMemo, useState } from "react"
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion"
import { cn } from "@/lib/utils"

// ============================================
// CAROUSEL 3D - VALLE AI
// Carrossel 3D para notícias e conteúdos
// ============================================

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

type UseMediaQueryOptions = {
  defaultValue?: boolean
  initializeWithValue?: boolean
}

const IS_SERVER = typeof window === "undefined"

export function useMediaQuery(
  query: string,
  {
    defaultValue = false,
    initializeWithValue = true,
  }: UseMediaQueryOptions = {}
): boolean {
  const getMatches = (query: string): boolean => {
    if (IS_SERVER) {
      return defaultValue
    }
    return window.matchMedia(query).matches
  }

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return getMatches(query)
    }
    return defaultValue
  })

  const handleChange = () => {
    setMatches(getMatches(query))
  }

  useIsomorphicLayoutEffect(() => {
    const matchMedia = window.matchMedia(query)
    handleChange()

    matchMedia.addEventListener("change", handleChange)

    return () => {
      matchMedia.removeEventListener("change", handleChange)
    }
  }, [query])

  return matches
}

interface NewsItem {
  id: string | number
  title: string
  description?: string
  image: string
  category?: string
  date?: string
  href?: string
}

interface Carousel3DProps {
  items: NewsItem[]
  onItemClick?: (item: NewsItem) => void
  className?: string
  hideInstructions?: boolean
}

const duration = 0.15
const transition = { duration, ease: "easeOut" as const }
const transitionOverlay = { duration: 0.5, ease: "easeOut" as const }

const CarouselInner = memo(
  ({
    handleClick,
    controls,
    items,
    isCarouselActive,
  }: {
    handleClick: (item: NewsItem, index: number) => void
    controls: ReturnType<typeof useAnimation>
    items: NewsItem[]
    isCarouselActive: boolean
  }) => {
    const isScreenSizeSm = useMediaQuery("(max-width: 640px)")
    const cylinderWidth = isScreenSizeSm ? 1100 : 1800
    const faceCount = items.length
    const faceWidth = cylinderWidth / faceCount
    const radius = cylinderWidth / (2 * Math.PI)
    const rotation = useMotionValue(0)
    const transform = useTransform(
      rotation,
      (value) => `rotate3d(0, 1, 0, ${value}deg)`
    )

    return (
      <div
        className="flex h-full items-center justify-center"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <motion.div
          drag={isCarouselActive ? "x" : false}
          className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
          style={{
            transform,
            rotateY: rotation,
            width: cylinderWidth,
            transformStyle: "preserve-3d",
          }}
          onDrag={(_, info) =>
            isCarouselActive &&
            rotation.set(rotation.get() + info.offset.x * 0.05)
          }
          onDragEnd={(_, info) =>
            isCarouselActive &&
            controls.start({
              rotateY: rotation.get() + info.velocity.x * 0.05,
              transition: {
                type: "spring",
                stiffness: 100,
                damping: 30,
                mass: 0.1,
              },
            })
          }
          animate={controls}
        >
          {items.map((item, i) => (
            <motion.div
              key={`carousel-${item.id}-${i}`}
              className="absolute flex h-full origin-center items-center justify-center rounded-xl p-2"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${
                  i * (360 / faceCount)
                }deg) translateZ(${radius}px)`,
              }}
              onClick={() => handleClick(item, i)}
            >
              <div className="relative w-full rounded-xl overflow-hidden bg-white dark:bg-[#001533]/80 shadow-lg border-2 border-[#001533]/10 dark:border-white/10 hover:shadow-xl transition-shadow">
                <motion.img
                  src={item.image}
                  alt={item.title}
                  layoutId={`img-${item.id}`}
                  className="pointer-events-none w-full aspect-video object-cover"
                  initial={{ filter: "blur(4px)" }}
                  layout="position"
                  animate={{ filter: "blur(0px)" }}
                  transition={transition}
                />
                <div className="p-4">
                  {item.category && (
                    <span className="text-xs font-medium text-[#1672d6] mb-1 block">
                      {item.category}
                    </span>
                  )}
                  <h3 className="font-semibold text-[#001533] dark:text-white text-sm line-clamp-2">
                    {item.title}
                  </h3>
                  {item.date && (
                    <p className="text-xs text-[#001533]/50 dark:text-white/50 mt-2">
                      {item.date}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    )
  }
)

CarouselInner.displayName = "CarouselInner"

export function Carousel3D({ items, onItemClick, className, hideInstructions = false }: Carousel3DProps) {
  const [activeItem, setActiveItem] = useState<NewsItem | null>(null)
  const [isCarouselActive, setIsCarouselActive] = useState(true)
  const controls = useAnimation()

  const handleClick = (item: NewsItem, index: number) => {
    if (onItemClick) {
      onItemClick(item)
    } else {
      setActiveItem(item)
      setIsCarouselActive(false)
      controls.stop()
    }
  }

  const handleClose = () => {
    setActiveItem(null)
    setIsCarouselActive(true)
  }

  return (
    <motion.div layout className={cn("relative", className)}>
      <AnimatePresence mode="sync">
        {activeItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            layoutId={`img-container-${activeItem.id}`}
            layout="position"
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 md:p-12 cursor-pointer"
            style={{ willChange: "opacity" }}
            transition={transitionOverlay}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0a0f1a] rounded-2xl overflow-hidden max-w-3xl w-full cursor-default"
            >
              <motion.img
                layoutId={`img-${activeItem.id}`}
                src={activeItem.image}
                alt={activeItem.title}
                className="w-full aspect-video object-cover"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  duration: 0.4,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              />
              <div className="p-6">
                {activeItem.category && (
                  <span className="inline-block px-3 py-1 bg-[#1672d6]/10 text-[#1672d6] text-sm font-medium rounded-full mb-3">
                    {activeItem.category}
                  </span>
                )}
                <h2 className="text-xl font-bold text-[#001533] dark:text-white mb-2">
                  {activeItem.title}
                </h2>
                {activeItem.description && (
                  <p className="text-[#001533]/70 dark:text-white/70 mb-4">
                    {activeItem.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  {activeItem.date && (
                    <p className="text-sm text-[#001533]/50 dark:text-white/50">
                      {activeItem.date}
                    </p>
                  )}
                  {activeItem.href && (
                    <a
                      href={activeItem.href}
                      className="text-[#1672d6] font-medium text-sm hover:underline"
                    >
                      Ler mais →
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative h-[400px] w-full overflow-hidden">
        <CarouselInner
          handleClick={handleClick}
          controls={controls}
          items={items}
          isCarouselActive={isCarouselActive}
        />
      </div>
      
      {/* Instrução */}
      {!hideInstructions && (
        <p className="text-center text-sm text-[#001533]/50 dark:text-white/50 mt-4">
          Arraste para explorar os insights • Clique para ver detalhes
        </p>
      )}
    </motion.div>
  )
}

export default Carousel3D

