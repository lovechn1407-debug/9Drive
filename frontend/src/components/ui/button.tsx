import { forwardRef } from 'react'
import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button'
import type { SxProps, Theme } from '@mui/material'

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'color'> {
  variant?: 'default' | 'outline' | 'ghost' | 'soft' | 'danger' | 'fab'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

function mapVariant(v: ButtonProps['variant']): { variant: MuiButtonProps['variant']; color: MuiButtonProps['color']; sx?: SxProps<Theme> } {
  switch (v) {
    case 'outline': return { variant: 'outlined', color: 'primary' }
    case 'ghost': return { variant: 'text', color: 'inherit' }
    case 'soft': return { variant: 'contained', color: 'secondary', sx: { backgroundColor: 'secondary.light', color: 'secondary.dark', '&:hover': { backgroundColor: 'secondary.light', opacity: 0.85 } } }
    case 'danger': return { variant: 'contained', color: 'error' }
    case 'fab': return { variant: 'contained', color: 'secondary', sx: { borderRadius: 16 } }
    default: return { variant: 'contained', color: 'primary' }
  }
}

function mapSize(s: ButtonProps['size']): MuiButtonProps['size'] {
  switch (s) {
    case 'sm': return 'small'
    case 'lg': return 'large'
    case 'icon': return 'small'
    default: return 'medium'
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, sx, ...props }, ref) => {
    const { variant: muiVariant, color, sx: variantSx } = mapVariant(variant)
    const muiSize = mapSize(size)

    const iconSx: SxProps<Theme> = size === 'icon'
      ? { minWidth: 0, width: 40, height: 40, padding: 0, borderRadius: '50%' }
      : {}

    return (
      <MuiButton
        ref={ref}
        variant={muiVariant}
        color={color}
        size={muiSize}
        sx={{ ...variantSx, ...iconSx, ...sx }}
        disableElevation
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
