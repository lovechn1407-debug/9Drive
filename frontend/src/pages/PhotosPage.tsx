import { useState, useEffect, useRef, forwardRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Dialog from '@mui/material/Dialog'
import Slide from '@mui/material/Slide'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Switch from '@mui/material/Switch'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'

import FolderSpecialIcon from '@mui/icons-material/FolderSpecial'
import SyncIcon from '@mui/icons-material/Sync'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import ShareIcon from '@mui/icons-material/Share'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ImageIcon from '@mui/icons-material/Image'
import InfoIcon from '@mui/icons-material/Info'
import SearchIcon from '@mui/icons-material/Search'
import LinkIcon from '@mui/icons-material/Link'
import PrintIcon from '@mui/icons-material/Print'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

import { apiFetch } from '@/lib/api'
import { useUpload } from '@/context/UploadContext'
import { useDriveLayoutActions } from '@/layouts/DriveLayout'
const Transition = forwardRef(function Transition(
  props: any & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export function PhotosPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadProgress, uploadFiles } = useUpload()
  const { setHeaderActions } = useDriveLayoutActions()
  const cols = 4

  const [viewerFile, setViewerFile] = useState<any | null>(null)
  const [autoUploadOpen, setAutoUploadOpen] = useState(false)
  const [syncSettingsOpen, setSyncSettingsOpen] = useState(false)

  // Dummy state for folders
  const [allFoldersSync, setAllFoldersSync] = useState(false)
  const [folders, setFolders] = useState([
    { id: 1, name: 'Camera', synced: false, thumb: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?w=100' },
    { id: 2, name: 'WhatsApp Images', synced: false, thumb: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100' },
    { id: 3, name: 'Screenshots', synced: false, thumb: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100' }
  ])

  useEffect(() => {
    setHeaderActions(
      <Button
        variant="contained"
        startIcon={<AddPhotoAlternateIcon />}
        onClick={() => fileInputRef.current?.click()}
        sx={{ borderRadius: 9999, fontWeight: 700, px: 3 }}
      >
        Upload Photos
      </Button>
    )
    return () => setHeaderActions(null)
  }, [setHeaderActions])

  async function loadPhotos() {
    try {
      const data = await apiFetch<{ files: any[] }>('/files?isGallery=1')
      setFiles(data.files)
    } catch (e) {
      console.error('Failed to load photos', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPhotos()
    const handleStorageChange = () => loadPhotos()
    window.addEventListener('9drive:storage-changed', handleStorageChange)
    return () => window.removeEventListener('9drive:storage-changed', handleStorageChange)
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files), null, null, true)
    }
    e.target.value = ''
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0, overflowY: 'auto', position: 'relative' }}>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Header Area */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.default' }}>
        <Typography variant="h5" fontWeight={800}>Gallery</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => setAutoUploadOpen(true)} color="primary">
            <FolderSpecialIcon />
          </IconButton>
          <IconButton onClick={() => setSyncSettingsOpen(true)} color="primary">
            <SyncIcon />
          </IconButton>
        </Stack>
      </Box>

      {files.length === 0 ? (
        <Box sx={{ m: 'auto', textAlign: 'center', maxWidth: 400 }}>
          <AddPhotoAlternateIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={700}>No Photos Yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            Upload your memories here. They will be kept private and separate from your main drive files.
          </Typography>
          <Button variant="contained" onClick={() => fileInputRef.current?.click()} sx={{ borderRadius: 9999 }}>
            Upload your first photo
          </Button>
        </Box>
      ) : (
        <Box>
          <ImageList cols={cols} gap={0} sx={{ m: 0 }}>
            {files.map((file) => (
              <PhotoItem key={file.id} file={file} onClick={() => setViewerFile(file)} />
            ))}
          </ImageList>
        </Box>
      )}

      {/* Floating Upload Button for Mobile */}
      <Button
        variant="contained"
        startIcon={<CloudUploadIcon sx={{ fontSize: '1.5rem !important' }} />}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: uploadProgress.open && uploadProgress.collapsed ? { xs: 164, sm: 112 } : { xs: 96, sm: 48 },
          right: { xs: 24, sm: 48 },
          boxShadow: 6,
          zIndex: 1000,
          px: 4,
          py: 2,
          fontSize: '1rem',
          fontWeight: 700,
          borderRadius: 1,
          opacity: uploadProgress.open && !uploadProgress.collapsed ? 0 : 1,
          transform: uploadProgress.open && !uploadProgress.collapsed ? 'scale(0.8)' : 'scale(1)',
          pointerEvents: uploadProgress.open && !uploadProgress.collapsed ? 'none' : 'auto',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        Upload
      </Button>

      {/* Auto Upload Folders Dialog */}
      <Dialog open={autoUploadOpen} onClose={() => setAutoUploadOpen(false)} fullWidth maxWidth="sm">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Device folders</Typography>
          <List>
            <ListItem>
              <ListItemText primary="All device folders" secondary="Auto-upload photos from all folders" />
              <Switch checked={allFoldersSync} onChange={(e) => {
                setAllFoldersSync(e.target.checked)
                setFolders(f => f.map(folder => ({ ...folder, synced: e.target.checked })))
              }} />
            </ListItem>
            <Divider sx={{ my: 1 }} />
            {folders.map(folder => (
              <ListItem key={folder.id}>
                <ListItemIcon>
                  <Avatar src={folder.thumb} variant="rounded" />
                </ListItemIcon>
                <ListItemText primary={folder.name} />
                <Switch checked={folder.synced} onChange={(e) => {
                  setFolders(f => f.map(fd => fd.id === folder.id ? { ...fd, synced: e.target.checked } : fd))
                }} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Dialog>

      {/* Sync Settings Dialog */}
      <Dialog open={syncSettingsOpen} onClose={() => setSyncSettingsOpen(false)} fullWidth maxWidth="xs">
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Sync Settings</Typography>
          <Stack spacing={2}>
            <Button variant="outlined" size="large" fullWidth startIcon={<SyncIcon />}>
              Auto Sync
            </Button>
            <Button variant="contained" size="large" fullWidth startIcon={<CloudUploadIcon />}>
              Press to sync phone image files
            </Button>
          </Stack>
        </Box>
      </Dialog>

      {/* Photo Viewer */}
      {viewerFile && (
        <PhotoViewer file={viewerFile} onClose={() => setViewerFile(null)} />
      )}
    </Box>
  )
}

function PhotoItem({ file, onClick }: { file: any, onClick: () => void }) {
  const [url, setUrl] = useState(file.thumbnailLink || '')

  useEffect(() => {
    if (url) return // Skip fetching preview token if we already have a thumbnailLink
    apiFetch<{ path: string }>(`/files/${file.id}/preview-token`, { method: 'POST' })
      .then(res => {
        setUrl(`${import.meta.env.VITE_API_URL}${res.path}`)
      })
      .catch(console.error)
  }, [file.id, url])

  return (
    <ImageListItem onClick={onClick} sx={{ overflow: 'hidden', cursor: 'pointer', aspectRatio: '1/1', position: 'relative', '&:hover': { opacity: 0.8 } }}>
      {url ? (
        <img
          src={url}
          alt={file.name}
          loading="lazy"
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Box sx={{ width: '100%', height: '100%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </ImageListItem>
  )
}

function PhotoViewer({ file, onClose }: { file: any, onClose: () => void }) {
  const [fullUrl, setFullUrl] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  useEffect(() => {
    apiFetch<{ path: string }>(`/files/${file.id}/preview-token`, { method: 'POST' })
      .then(res => {
        setFullUrl(`${import.meta.env.VITE_API_URL}${res.path}`)
      })
      .catch(console.error)
  }, [file.id])

  const dateStr = new Date(file.createdAt).toLocaleString(undefined, { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <Dialog fullScreen open TransitionComponent={Transition} PaperProps={{ sx: { bgcolor: 'black', color: 'white' } }}>
      {/* Top Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, bgcolor: 'rgba(0,0,0,0.5)' }}>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, ml: 2, overflow: 'hidden' }}>
          <Typography variant="body1" noWrap fontWeight={700}>{file.name}</Typography>
          <Typography variant="caption" noWrap sx={{ opacity: 0.7 }}>{dateStr}</Typography>
        </Box>
        <IconButton sx={{ color: 'white' }}>
          <StarOutlineIcon />
        </IconButton>
      </Box>

      {/* Image Area */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 7, mb: 7 }}>
        {fullUrl ? (
          <img
            src={fullUrl}
            alt={file.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : (
          <CircularProgress sx={{ color: 'white' }} />
        )}
      </Box>

      {/* Bottom Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', p: 1, position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, bgcolor: 'rgba(0,0,0,0.5)' }}>
        <Stack alignItems="center" sx={{ cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 } }}>
          <ShareIcon fontSize="small" />
          <Typography variant="caption" sx={{ mt: 0.5 }}>Share</Typography>
        </Stack>
        <Stack alignItems="center" sx={{ cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 } }}>
          <EditIcon fontSize="small" />
          <Typography variant="caption" sx={{ mt: 0.5 }}>Edit</Typography>
        </Stack>
        <Stack alignItems="center" sx={{ cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 } }}>
          <DeleteIcon fontSize="small" />
          <Typography variant="caption" sx={{ mt: 0.5 }}>Trash</Typography>
        </Stack>
        <Stack alignItems="center" sx={{ cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 } }} onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVertIcon fontSize="small" />
          <Typography variant="caption" sx={{ mt: 0.5 }}>More</Typography>
        </Stack>
      </Box>

      {/* More Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
          <ListItemText>About</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><SearchIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Google Lens</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Use as</ListItemText>
        </MenuItem>
      </Menu>
    </Dialog>
  )
}
