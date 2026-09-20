import type { MouseEvent } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { FileIcon } from '@/components/drive/FileIcon'
import type { FileItem } from '@/data/drive-data'

export type FileSizeScale = 'xs' | 'sm' | 'md' | 'lg'

const scaleConfig: Record<FileSizeScale, { cols: number; iconSize: number; spacing: number }> = {
  xs: { cols: 4, iconSize: 32, spacing: 1 },
  sm: { cols: 3, iconSize: 40, spacing: 1.5 },
  md: { cols: 2, iconSize: 56, spacing: 2 },
  lg: { cols: 1, iconSize: 72, spacing: 2.5 },
}

export function FileGrid({
  files,
  selectedFileIds = new Set<string>(),
  mobileTwoColumns = false,
  sizeScale = 'md',
  onFileContextMenu,
  onToggleFile,
}: {
  files: FileItem[]
  selectedFileIds?: Set<string>
  mobileTwoColumns?: boolean
  sizeScale?: FileSizeScale
  onFileContextMenu?: (event: MouseEvent<HTMLElement>, file: FileItem) => void
  onToggleFile?: (file: FileItem) => void
}) {
  const cfg = scaleConfig[sizeScale]
  const colsMobile = mobileTwoColumns ? 6 : Math.max(12 / cfg.cols, 4)

  return (
    <>
      {files.map((file) => {
        const selected = selectedFileIds.has(file.id ?? '')
        return (
          <Grid key={file.id ?? file.name} size={{ xs: colsMobile, sm: 12 / Math.max(cfg.cols - 1, 1) }}>
            <Card
              variant="outlined"
              draggable
              onDragStart={(e: any) => { e.dataTransfer.setData('text/plain', file.id ?? ''); e.dataTransfer.effectAllowed = 'move' }}
              onContextMenu={(e: MouseEvent<HTMLDivElement>) => onFileContextMenu?.(e, file)}
              sx={{
                position: 'relative',
                cursor: 'grab',
                transition: 'all 0.2s',
                outline: selected ? '2px solid' : 'none',
                outlineColor: selected ? 'primary.main' : 'transparent',
                bgcolor: selected ? 'action.selected' : 'background.paper',
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
                onClick={(e) => { e.stopPropagation(); onFileContextMenu?.(e, file) }}
                aria-label={`Open ${file.name} menu`}
                sx={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>

              <CardActionArea sx={{ flexGrow: 1 }} onClick={() => onToggleFile?.(file)}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 3, px: 2, height: '100%' }}>
                  {/* File icon */}
                  <Box sx={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.05)' },
                  }}>
                    <FileIcon kind={file.kind} className="!w-full !h-full !p-0" />
                  </Box>

                  <Typography
                    variant={sizeScale === 'lg' ? 'subtitle1' : 'body2'}
                    fontWeight={600}
                    sx={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3, mb: 1 }}
                    title={file.name}
                  >
                    {file.name}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        )
      })}
    </>
  )
}
