import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import CloseIcon from '@mui/icons-material/Close'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import StorageIcon from '@mui/icons-material/Storage'
import FolderIcon from '@mui/icons-material/Folder'
import CloudIcon from '@mui/icons-material/Cloud'
import EmailIcon from '@mui/icons-material/Email'
import LabelIcon from '@mui/icons-material/Label'
import CategoryIcon from '@mui/icons-material/Category'
import { formatBytes, formatDate } from '@/lib/api'
import type { FileItem } from '@/data/drive-data'

function DetailRow({ icon: Icon, label, value }: { icon: typeof LabelIcon; label: string; value: string }) {
  return (
    <ListItem disableGutters sx={{ px: 0, alignItems: 'flex-start', gap: 0 }}>
      <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
        <Icon fontSize="small" color="primary" />
      </ListItemIcon>
      <ListItemText
        primary={<Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Typography>}
        secondary={<Typography variant="body2" fontWeight={600} color="text.primary" sx={{ wordBreak: 'break-word' }}>{value}</Typography>}
      />
    </ListItem>
  )
}

export function FileDetailsDrawer({ open, file, onClose }: { open: boolean; file: FileItem | null; onClose: () => void }) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 400 } } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>File Details</Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 280, display: 'block' }}>
            {file?.name ?? 'No file selected'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close file details" size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      {file && (
        <List sx={{ px: 2.5, py: 2 }} disablePadding>
          <Divider sx={{ mb: 2 }} />
          <DetailRow icon={LabelIcon} label="Name" value={file.name} />
          <DetailRow icon={StorageIcon} label="Size" value={file.sizeBytes ? formatBytes(file.sizeBytes) : file.size} />
          <DetailRow icon={CalendarMonthIcon} label="Uploaded At" value={file.createdAt ? formatDate(file.createdAt) : file.date} />
          <DetailRow icon={EmailIcon} label="Google Account" value={file.accountEmail ?? file.access} />
          <DetailRow icon={CloudIcon} label="Provider" value={file.accountProvider ?? 'google_drive'} />
          <DetailRow icon={FolderIcon} label="Virtual Folder" value={file.folderName ?? 'No folder'} />
          <DetailRow icon={CategoryIcon} label="MIME Type" value={file.mimeType ?? 'Unknown'} />
        </List>
      )}
    </Drawer>
  )
}
