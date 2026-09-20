import type { MouseEvent, DragEvent } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { FolderVisual } from '@/components/drive/FolderVisual'
import type { FolderItem } from '@/data/drive-data'

export type FolderSizeScale = 'xs' | 'sm' | 'md' | 'lg'

const scaleConfig: Record<FolderSizeScale, { cols: number; iconSize: number; spacing: number }> = {
  xs: { cols: 4, iconSize: 36, spacing: 1 },
  sm: { cols: 3, iconSize: 48, spacing: 1.5 },
  md: { cols: 2, iconSize: 72, spacing: 2 },
  lg: { cols: 1, iconSize: 96, spacing: 2.5 },
}

export function FolderGrid({
  items,
  mobileTwoColumns = false,
  sizeScale = 'md',
  onFolderMenu,
  onFolderOpen,
  onDropItem,
}: {
  items: FolderItem[]
  mobileTwoColumns?: boolean
  sizeScale?: FolderSizeScale
  onFolderMenu?: (event: MouseEvent<HTMLElement>, folder: FolderItem) => void
  onFolderOpen?: (folder: FolderItem) => void
  onDropItem?: (fileId: string, folderId: string) => void
}) {
  const cfg = scaleConfig[sizeScale]
  const colsMobile = mobileTwoColumns ? 6 : Math.max(12 / cfg.cols, 4)

  return (
    <>
      {items.map((folder) => (
        <Grid key={folder.id || folder.name} size={{ xs: colsMobile, sm: 12 / Math.max(cfg.cols - 1, 1) }}>
          <Card
            variant="outlined"
            onContextMenu={(e: MouseEvent<HTMLDivElement>) => onFolderMenu?.(e, folder)}
            onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDrop={(e: DragEvent<HTMLDivElement>) => {
              e.preventDefault()
              const fileId = e.dataTransfer.getData('text/plain')
              if (fileId && folder.id) onDropItem?.(fileId, folder.id)
            }}
            sx={{
              position: 'relative',
              transition: 'all 0.2s',
              bgcolor: 'background.paper',
              borderRadius: '12px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
            }}
          >
            {/* Context menu button */}
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onFolderMenu?.(e, folder) }}
              aria-label={`Open ${folder.name} menu`}
              sx={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>

            <CardActionArea sx={{ flexGrow: 1 }} onClick={() => onFolderOpen?.(folder)}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 3, px: 2, height: '100%' }}>
                <Box sx={{ width: 32, height: 32, mb: 1.5, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }}>
                  <FolderVisual folder={folder} className="!w-full !h-full !flex" iconClassName="!w-full !h-full" />
                </Box>
                <Typography
                  variant={sizeScale === 'lg' ? 'subtitle1' : 'body2'}
                  fontWeight={600}
                  sx={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3, mb: 0 }}
                >
                  {folder.name}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </>
  )
}
