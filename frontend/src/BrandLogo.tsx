import type { ReactNode } from 'react'

export default function BrandLogo({
  logo,
  label = 'ASVORA',
  className = '',
  imageClassName = '',
  children,
}: {
  logo?: string
  label?: string
  className?: string
  imageClassName?: string
  children: ReactNode
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {logo && (
        <img
          src={logo}
          alt={`${label} logo`}
          className={`h-9 w-9 shrink-0 rounded-lg bg-white/5 p-1 object-contain ${imageClassName}`}
        />
      )}
      <span>{children}</span>
    </span>
  )
}
