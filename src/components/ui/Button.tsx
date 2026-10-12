import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'ice'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-[0_8px_24px_-8px_rgba(255,122,61,0.6)] hover:brightness-105',
  secondary: 'bg-elev-2 text-ink hover:brightness-110',
  ghost: 'text-ink hover:bg-elev-2',
  outline: 'border border-line text-ink hover:bg-elev-2',
  ice: 'bg-primary text-primary-ink hover:brightness-105',
}

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-xl gap-1.5',
  md: 'h-12 px-5 text-[15px] rounded-2xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2.5',
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra = '') =>
  `inline-flex select-none items-center justify-center font-semibold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${VARIANT[variant]} ${SIZE[size]} ${extra}`

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({ variant, size, className = '', type = 'button', ...rest }: Props) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />
}

export function LinkButton({ variant, size, className = '', ...rest }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />
}

export function IconButton({
  label,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
