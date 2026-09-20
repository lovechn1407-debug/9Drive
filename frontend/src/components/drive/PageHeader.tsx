import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: string; actions?: ReactNode }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ sm: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mt: { xs: 1, sm: 2 } }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ letterSpacing: '-0.3px', fontSize: { xs: '1.125rem', sm: '1.375rem', lg: '1.625rem' } }}
        >
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
          <Box sx={{ width: '100%' }}>
            {actions}
          </Box>
        </Stack>
      )}
    </Stack>
  )
}
