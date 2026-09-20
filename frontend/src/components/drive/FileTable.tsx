import { type MouseEvent, useState } from 'react'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import StarIcon from '@mui/icons-material/Star'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove'
import { AvatarStack } from '@/components/drive/AvatarStack'
import { FileIcon } from '@/components/drive/FileIcon'
import type { FileItem, FolderItem } from '@/data/drive-data'
import { apiFetch } from '@/lib/api'

export function FileTable({
  files,
  folders = [],
  mode = 'default',
  selectedFileIds = new Set<string>(),
  allSelected = false,
  onFileContextMenu,
  onFolderContextMenu,
  onToggleFile,
  onToggleAll,
  onFolderOpen,
}: {
  files: FileItem[]
  folders?: FolderItem[]
  mode?: 'default' | 'shared' | 'recent' | 'starred' | 'archived'
  selectedFileIds?: Set<string>
  allSelected?: boolean
  onFileContextMenu?: (event: MouseEvent<HTMLElement>, file: FileItem) => void
  onFolderContextMenu?: (event: MouseEvent<HTMLElement>, folder: FolderItem) => void
  onToggleFile?: (file: FileItem) => void
  onToggleAll?: () => void
  onFolderOpen?: (folder: FolderItem) => void
}) {
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null)

  return (
    <Box sx={{ mt: 2 }}>
      {/* Mobile card view */}
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        

        
        {folders.map((folder) => {
          return (
            <Card
              key={folder.id ?? folder.name}
              variant="outlined"
              onClick={() => onFolderOpen?.(folder)}
              onContextMenu={(e: MouseEvent<HTMLDivElement>) => onFolderContextMenu?.(e, folder)}
              sx={{
                cursor: 'pointer',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'all 0.15s',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.5 }}>
                <Box sx={{ flexShrink: 0 }}>
                  <FolderOpenIcon sx={{ color: folder.color || 'primary.main', fontSize: 20 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <Typography variant="body2" fontWeight={500} noWrap title={folder.name}>{folder.name}</Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">{folder.updated}</Typography>
                  </Stack>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onFolderContextMenu?.(e, folder) }}
                  aria-label={`Open ${folder.name} menu`}
                  sx={{ flexShrink: 0 }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Card>
          )
        })}



            {files.map((file) => {
          const selected = selectedFileIds.has(file.id ?? '')
          const meta = mode === 'archived' ? file.location : mode === 'recent' ? file.openedDate : mode === 'starred' ? file.starredDate : file.date
          return (
            <Card
              key={file.id ?? file.name}
              variant="outlined"
              draggable
              onDragStart={(e: any) => { e.dataTransfer.setData('text/plain', file.id ?? ''); e.dataTransfer.effectAllowed = 'move' }}
              onClick={() => onToggleFile?.(file)}
              onContextMenu={(e: MouseEvent<HTMLDivElement>) => onFileContextMenu?.(e, file)}
              sx={{
                cursor: 'grab',
                outline: selected ? '2px solid' : 'none',
                outlineColor: selected ? 'primary.main' : 'transparent',
                bgcolor: selected ? 'action.selected' : 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'all 0.15s',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.5 }}>
                
                <Box sx={{ flexShrink: 0 }}>
                  {mode === 'starred' ? <StarIcon sx={{ color: 'warning.main', fontSize: 20 }} /> : <FileIcon kind={file.kind} />}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <Typography variant="body2" fontWeight={500} noWrap title={file.name}>{file.name}</Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">{meta}</Typography>
                    <Typography variant="caption" color="text.secondary">·</Typography>
                    <Typography variant="caption" color="text.secondary">{file.size}</Typography>
                    {file.folderName && (
                      <>
                        <Typography variant="caption" color="text.secondary">·</Typography>
                        <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <FolderOpenIcon sx={{ fontSize: 12 }} />{file.folderName}
                        </Typography>
                      </>
                    )}
                  </Stack>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onFileContextMenu?.(e, file) }}
                  aria-label={`Open ${file.name} menu`}
                  sx={{ flexShrink: 0 }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Card>
          )
        })}
      </Box>

      {/* Desktop table view */}
      <Box sx={{ display: { xs: 'none', sm: 'block' }, overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              
              <TableCell><Typography variant="caption" fontWeight={700} color="text.primary">Name</Typography></TableCell>
              {mode === 'default' && <TableCell><Typography variant="caption" fontWeight={600} color="text.secondary">Folder</Typography></TableCell>}
              {mode === 'shared' && <TableCell><Typography variant="caption" fontWeight={700} color="text.primary">Owner</Typography></TableCell>}
              {mode === 'recent' && <TableCell><Typography variant="caption" fontWeight={700} color="text.primary">Last Opened</Typography></TableCell>}
              {mode === 'starred' && <TableCell><Typography variant="caption" fontWeight={700} color="text.primary">Starred On</Typography></TableCell>}
              {mode === 'archived' && <TableCell><Typography variant="caption" fontWeight={700} color="text.primary">Archived Date</Typography></TableCell>}
              {mode === 'archived'
                ? <TableCell><Typography variant="caption" fontWeight={700} color="text.primary">Original Location</Typography></TableCell>
                : <TableCell><Typography variant="caption" fontWeight={700} color="text.primary">Last Modified</Typography></TableCell>}
              <TableCell><Typography variant="caption" fontWeight={700} color="text.primary">Size</Typography></TableCell>
              <TableCell><Typography variant="caption" fontWeight={700} color="text.primary">Access</Typography></TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {folders.map((folder) => {
              return (
                <TableRow
                  key={folder.id ?? folder.name}
                  draggable
                  onDragStart={(e: any) => { e.dataTransfer.setData('text/plain', folder.id ?? ''); e.dataTransfer.effectAllowed = 'move' }}
                  onContextMenu={(e: MouseEvent<HTMLTableRowElement>) => onFolderContextMenu?.(e as any, folder)}
                  onClick={() => onFolderOpen?.(folder)}
                  hover
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FolderOpenIcon sx={{ color: folder.color || 'primary.main', fontSize: 18 }} />
                      <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 280 }} title={folder.name}>
                        {folder.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  {mode === 'default' && <TableCell><Typography variant="caption" color="text.disabled">—</Typography></TableCell>}
                  {mode === 'shared' && <TableCell><Typography variant="body2" color="text.secondary">—</Typography></TableCell>}
                  {mode === 'recent' && <TableCell><Typography variant="body2" color="text.secondary">—</Typography></TableCell>}
                  {mode === 'starred' && <TableCell><Typography variant="body2" color="text.secondary">—</Typography></TableCell>}
                  {mode === 'archived' && <TableCell><Typography variant="body2" color="text.secondary">—</Typography></TableCell>}
                  <TableCell><Typography variant="body2" color="text.secondary">{folder.updated}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">—</Typography></TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AvatarStack count={1} />
                      <Typography variant="body2" color="text.secondary">me</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5} className="group">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onFolderContextMenu?.(e, folder) }}
                        aria-label={`Open ${folder.name} menu`}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}
            {files.map((file) => {
              const selected = selectedFileIds.has(file.id ?? '')
              return (
                <TableRow
                  key={file.id ?? file.name}
                  draggable
                  onDragStart={(e: any) => { e.dataTransfer.setData('text/plain', file.id ?? ''); e.dataTransfer.effectAllowed = 'move' }}
                  onContextMenu={(e: MouseEvent<HTMLTableRowElement>) => onFileContextMenu?.(e as any, file)}
                  onClick={() => onToggleFile?.(file)}
                  selected={selected}
                  hover
                  sx={{ cursor: 'grab', '&.Mui-selected': { bgcolor: 'action.selected' } }}
                >
                  
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {mode === 'starred' ? <StarIcon sx={{ color: 'warning.main', fontSize: 18 }} /> : <FileIcon kind={file.kind} />}
                      <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 280 }} title={file.name}>
                        {file.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  {mode === 'default' && (
                    <TableCell>
                      {file.folderName ? (
                        <Chip
                          icon={<FolderOpenIcon sx={{ fontSize: '0.75rem !important' }} />}
                          label={file.folderName}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 22, maxWidth: 140 }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                  )}
                  {mode === 'shared' && <TableCell><Typography variant="body2" color="text.secondary">{file.owner}</Typography></TableCell>}
                  {mode === 'recent' && <TableCell><Typography variant="body2" color="text.secondary">{file.openedDate}</Typography></TableCell>}
                  {mode === 'starred' && <TableCell><Typography variant="body2" color="text.secondary">{file.starredDate}</Typography></TableCell>}
                  {mode === 'archived' && <TableCell><Typography variant="body2" color="text.secondary">{file.archivedDate}</Typography></TableCell>}
                  <TableCell><Typography variant="body2" color="text.secondary">{mode === 'archived' ? file.location : file.date}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{file.size}</Typography></TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AvatarStack count={file.shared} />
                      <Typography variant="body2" color="text.secondary">{file.access}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5} className="group">
                      <Button
                        size="small"
                        variant="outlined"
                        color={copiedFileId === file.id ? 'success' : 'primary'}
                        startIcon={<ContentCopyIcon sx={{ fontSize: '0.75rem !important' }} />}
                        sx={{ opacity: 0, fontSize: '0.7rem', height: 26, px: 1, py: 0, minWidth: 0, '.MuiTableRow-root:hover &': { opacity: 1 }, transition: 'opacity 0.15s' }}
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const data = await apiFetch<{ url: string | null }>(`/files/${file.id}/view-url`)
                            const url = data.url ?? (await apiFetch<{ url: string }>(`/files/${file.id}/share`, { method: 'POST' })).url
                            await navigator.clipboard.writeText(url)
                            setCopiedFileId(file.id ?? null)
                            setTimeout(() => setCopiedFileId(null), 2000)
                          } catch { /* ignore */ }
                        }}
                      >
                        {copiedFileId === file.id ? 'Copied' : 'Copy'}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        startIcon={<DriveFileMoveIcon sx={{ fontSize: '0.75rem !important' }} />}
                        sx={{ opacity: 0, fontSize: '0.7rem', height: 26, px: 1, py: 0, minWidth: 0, '.MuiTableRow-root:hover &': { opacity: 1 }, transition: 'opacity 0.15s' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          window.dispatchEvent(new CustomEvent('9drive:open-move-modal', { detail: file }))
                        }}
                      >
                        Move
                      </Button>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onFileContextMenu?.(e, file) }}
                        aria-label={`Open ${file.name} menu`}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}
