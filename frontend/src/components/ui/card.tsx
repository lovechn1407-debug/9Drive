import MuiCard, { type CardProps as MuiCardProps } from '@mui/material/Card'

export function Card({ children, sx, ...props }: MuiCardProps) {
  return (
    <MuiCard variant="outlined" sx={{ backgroundImage: 'none', ...sx }} {...props}>
      {children}
    </MuiCard>
  )
}
