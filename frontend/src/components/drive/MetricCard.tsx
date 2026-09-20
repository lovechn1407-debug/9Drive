import type { ElementType } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import type { LucideIcon } from 'lucide-react'

export function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  const LucideAsElement = Icon as ElementType
  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>{value}</Typography>
        </Box>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 44, height: 44, borderRadius: 3 }}>
          <LucideAsElement size={20} />
        </Avatar>
      </CardContent>
    </Card>
  )
}
