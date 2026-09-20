import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove'
import InfoIcon from '@mui/icons-material/Info'
import ShareIcon from '@mui/icons-material/Share'
import LinkIcon from '@mui/icons-material/Link'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import type { FileItem } from '@/data/drive-data'

type Props = {
  x: number
  y: number
  file: FileItem | null
  onClose: () => void
  onView: () => void
  onDownload: () => void
  onRename: () => void
  onMove: () => void
  onDetails: () => void
  onShare: () => void
  onCopyLink: () => void
  onInvite: () => void
  onDelete: () => void
}

const kindColors: Record<string, string> = {
  image: 'success',
  video: 'secondary',
  pdf: 'error',
  doc: 'primary',
}

export function FileContextMenu({ x, y, file, onClose, onView, onDownload, onRename, onMove, onDetails, onShare, onCopyLink, onInvite, onDelete }: Props) {
  if (!file) return null

  const anchorPosition = { top: y, left: x }
  const kindColor = (kindColors[file.kind] ?? 'default') as any

  return (
    <Menu
      open
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      slotProps={{ paper: { sx: { minWidth: 240 } } }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={file.kind.toUpperCase()} color={kindColor} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22 }} />
          {file.folderName && (
            <Chip icon={<FolderOpenIcon sx={{ fontSize: '0.75rem' }} />} label={file.folderName} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 22 }} />
          )}
        </Box>
        <Typography variant="body2" fontWeight={700} noWrap sx={{ mt: 0.5, maxWidth: 200 }} title={file.name}>
          {file.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">{file.size}</Typography>
      </Box>

      <MenuItem onClick={() => { onView(); onClose() }}>
        <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Preview</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onDownload(); onClose() }}>
        <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Download</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onRename(); onClose() }}>
        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Rename</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onMove(); onClose() }}>
        <ListItemIcon><DriveFileMoveIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Move to Folder</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onDetails(); onClose() }}>
        <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Details</ListItemText>
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      <MenuItem onClick={() => { onShare(); onClose() }}>
        <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Share Link</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onCopyLink(); onClose() }}>
        <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Copy Link</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onInvite(); onClose() }}>
        <ListItemIcon><PersonAddIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Invite Member</ListItemText>
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      <MenuItem onClick={() => { onDelete(); onClose() }} sx={{ color: 'error.main' }}>
        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
        <ListItemText>Delete</ListItemText>
      </MenuItem>
    </Menu>
  )
}
