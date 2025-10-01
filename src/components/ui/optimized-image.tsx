'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { useIntersectionObserver } from '@/lib/performance'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)
  
  // Use intersection observer for lazy loading
  const isInView = useIntersectionObserver(imageRef, {
    threshold: 0.1,
    rootMargin: '50px',
  })
  
  // Only load image when in view (unless priority is set)
  const shouldLoad = priority || isInView

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Generate blur placeholder if not provided
  const generateBlurDataURL = (w: number, h: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, w, h)
    }
    return canvas.toDataURL()
  }

  const defaultBlurDataURL = blurDataURL || (width && height ? generateBlurDataURL(width, height) : undefined)

  return (
    <div
      ref={imageRef}
      className={cn(
        'relative overflow-hidden',
        !isLoaded && 'animate-pulse bg-gray-200',
        className
      )}
      style={fill ? undefined : { width, height }}
    >
      {hasError ? (
        // Error fallback
        <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      ) : shouldLoad ? (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={defaultBlurDataURL}
          sizes={sizes}
          loading={loading}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            fill && `object-${objectFit}`
          )}
          style={fill ? undefined : { objectFit }}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        // Placeholder while not in view
        <div className="w-full h-full bg-gray-200 animate-pulse" />
      )}
      
      {/* Loading overlay */}
      {!isLoaded && !hasError && shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

// Preset configurations for common use cases
export function ProfileImage({ src, alt, size = 40, ...props }: {
  src: string
  alt: string
  size?: number
} & Partial<OptimizedImageProps>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full"
      quality={80}
      {...props}
    />
  )
}

export function JobImage({ src, alt, ...props }: {
  src: string
  alt: string
} & Partial<OptimizedImageProps>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={300}
      height={200}
      className="rounded-lg"
      quality={75}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  )
}

export function HeroImage({ src, alt, ...props }: {
  src: string
  alt: string
} & Partial<OptimizedImageProps>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority
      quality={85}
      objectFit="cover"
      sizes="100vw"
      {...props}
    />
  )
}