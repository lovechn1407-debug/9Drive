import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import UploadIcon from '@mui/icons-material/Upload'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'

type Props = {
  x: number
  y: number
  open: boolean
  canPasteFolder?: boolean
  onClose: () => void
  onUpload: () => void
  onCreateFolder: () => void
  onPasteFolder?: () => void
}

export function EmptyAreaContextMenu({ x, y, open, canPasteFolder = false, onClose, onUpload, onCreateFolder, onPasteFolder }: Props) {
  if (!open) return null

  return (
    <Menu
      open
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: y, left: x }}
      slotProps={{ paper: { sx: { minWidth: 200 } } }}
    >
      <MenuItem onClick={() => { onUpload(); onClose() }}>
        <ListItemIcon><UploadIcon fontSize="small" color="primary" /></ListItemIcon>
        <ListItemText primaryTypographyProps={{ color: 'primary', fontWeight: 600 }}>Upload File</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onCreateFolder(); onClose() }}>
        <ListItemIcon><CreateNewFolderIcon fontSize="small" /></ListItemIcon>
        <ListItemText>New Folder</ListItemText>
      </MenuItem>
      {canPasteFolder && onPasteFolder && (
        <>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={() => { onPasteFolder(); onClose() }}>
            <ListItemIcon><ContentPasteIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Paste Folder Here</ListItemText>
          </MenuItem>
        </>
      )}
    </Menu>
  )
}
