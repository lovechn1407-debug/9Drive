import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ContentCutIcon from '@mui/icons-material/ContentCut'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import DeleteIcon from '@mui/icons-material/Delete'
import type { FolderItem } from '@/data/drive-data'

type Props = {
  x: number
  y: number
  folder: FolderItem | null
  onClose: () => void
  onCut: () => void
  onRename: () => void
  onInvite: () => void
  onCopyLink: () => void
  onDelete: () => void
}

export function FolderContextMenu({ x, y, folder, onClose, onCut, onRename, onInvite, onCopyLink, onDelete }: Props) {
  if (!folder) return null

  return (
    <Menu
      open
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: y, left: x }}
      slotProps={{ paper: { sx: { minWidth: 220 } } }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <FolderOpenIcon sx={{ color: 'warning.main', fontSize: 20 }} />
        <Box>
          <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 160 }}>{folder.name}</Typography>
          <Typography variant="caption" color="text.secondary">Virtual folder</Typography>
        </Box>
      </Box>

      <MenuItem onClick={() => { onCopyLink(); onClose() }}>
        <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Copy Link</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onCut(); onClose() }}>
        <ListItemIcon><ContentCutIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Cut</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onRename(); onClose() }}>
        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Rename</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onInvite(); onClose() }}>
        <ListItemIcon><PersonAddIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Invite Member</ListItemText>
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      <MenuItem onClick={() => { onDelete(); onClose() }} sx={{ color: 'error.main' }}>
        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
        <ListItemText>Delete Folder</ListItemText>
      </MenuItem>
    </Menu>
  )
}
