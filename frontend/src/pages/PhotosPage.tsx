import { useState, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import Stack from '@mui/material/Stack'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Switch from '@mui/material/Switch'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'

import FolderSpecialIcon from '@mui/icons-material/FolderSpecial'
import SyncIcon from '@mui/icons-material/Sync'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import ShareIcon from '@mui/icons-material/Share'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'

import InfoIcon from '@mui/icons-material/Info'
import SearchIcon from '@mui/icons-material/Search'
import LinkIcon from '@mui/icons-material/Link'
import PrintIcon from '@mui/icons-material/Print'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

import { apiFetch, API_URL } from '@/lib/api'
import { useUpload } from '@/context/UploadContext'
import { useDriveLayoutActions } from '@/layouts/DriveLayout'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'

// Known Android photo directories to scan (relative to external storage root)
const PHONE_PHOTO_DIRS = [
  { name: 'Camera', path: 'DCIM/Camera' },
  { name: 'Screenshots', path: 'Pictures/Screenshots' },
  { name: 'WhatsApp Images', path: 'Pictures/WhatsApp Images' },
  { name: 'Downloads', path: 'Download' },
  { name: 'Pictures', path: 'Pictures' },
]

type DeviceFolder = { id: number; name: string; path: string; synced: boolean; thumb: string | null; count: number }

export function PhotosPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadProgress, uploadFiles } = useUpload()
  const { setHeaderActions } = useDriveLayoutActions()
  const cols = 4

  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [autoUploadOpen, setAutoUploadOpen] = useState(false)
  const [syncSettingsOpen, setSyncSettingsOpen] = useState(false)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false)
  const [allFoldersSync, setAllFoldersSync] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [foldersLoading, setFoldersLoading] = useState(false)
  const [folders, setFolders] = useState<DeviceFolder[]>([])

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

  // Request storage permission visibly on screen and scan real device folders
  useEffect(() => {
    if (!autoUploadOpen) return
    if (!Capacitor.isNativePlatform()) {
      setFolders([
        { id: 1, name: 'Camera', path: 'DCIM/Camera', synced: false, thumb: null, count: 0 },
        { id: 2, name: 'Screenshots', path: 'Pictures/Screenshots', synced: false, thumb: null, count: 0 },
        { id: 3, name: 'Downloads', path: 'Download', synced: false, thumb: null, count: 0 },
      ])
      return
    }
    async function requestPermAndScan() {
      setFoldersLoading(true)
      try {
        const permResult = await Filesystem.requestPermissions()
        const granted = permResult.publicStorage === 'granted'
        setPermissionGranted(granted)
        if (!granted) { setFoldersLoading(false); return }
        const found: DeviceFolder[] = []
        for (const dir of PHONE_PHOTO_DIRS) {
          try {
            const result = await Filesystem.readdir({ path: dir.path, directory: Directory.ExternalStorage })
            const imageFiles = result.files.filter(f =>
              f.type === 'file' && /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(f.name)
            )
            if (result.files.length === 0) continue
            let thumb: string | null = null
            if (imageFiles.length > 0) {
              try {
                const lastImg = imageFiles[imageFiles.length - 1]
                const fileData = await Filesystem.readFile({
                  path: `${dir.path}/${lastImg.name}`,
                  directory: Directory.ExternalStorage,
                })
                const mime = lastImg.name.toLowerCase().endsWith('png') ? 'image/png' : 'image/jpeg'
                thumb = `data:${mime};base64,${fileData.data}`
              } catch { /* thumbnail failed */ }
            }
            found.push({ id: found.length + 1, name: dir.name, path: dir.path, synced: false, thumb, count: imageFiles.length })
          } catch { /* folder doesn't exist, skip */ }
        }
        setFolders(found)
      } catch (e) {
        console.error('Permission/scan failed:', e)
      } finally {
        setFoldersLoading(false)
      }
    }
    requestPermAndScan()
  }, [autoUploadOpen])

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
          <Button variant="outlined" size="small" onClick={() => setAutoUploadOpen(true)} startIcon={<FolderSpecialIcon />}>
            Auto Upload Folders
          </Button>
          <Button variant="outlined" size="small" onClick={() => setSyncSettingsOpen(true)} startIcon={<SyncIcon />}>
            Sync Settings
          </Button>
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
            {files.map((file, idx) => (
              <PhotoItem key={file.id} file={file} onClick={() => setViewerIndex(idx)} />
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

          {foldersLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">Scanning device folders...</Typography>
            </Box>
          ) : Capacitor.isNativePlatform() && !permissionGranted && folders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="error.main" fontWeight={600}>Storage permission denied</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Please allow storage access from Settings to see your device folders.</Typography>
            </Box>
          ) : (
            <List>
              <ListItem>
                <ListItemText primary="All device folders" secondary="Auto-upload photos from all folders" />
                <Switch checked={allFoldersSync} onChange={(e) => {
                  setAllFoldersSync(e.target.checked)
                  setFolders(f => f.map(folder => ({ ...folder, synced: e.target.checked })))
                }} />
              </ListItem>
              <Divider sx={{ my: 1 }} />
              {folders.length === 0 ? (
                <ListItem><ListItemText primary="No photo folders found on device" /></ListItem>
              ) : folders.map(folder => (
                <ListItem key={folder.id}>
                  <ListItemIcon>
                    <Avatar
                      src={folder.thumb ?? undefined}
                      variant="rounded"
                      sx={{ width: 48, height: 48, bgcolor: 'action.hover' }}
                    >
                      {!folder.thumb && folder.name[0]}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={folder.name}
                    secondary={folder.count > 0 ? `${folder.count} photos` : undefined}
                  />
                  <Switch checked={folder.synced} onChange={(e) => {
                    setFolders(f => f.map(fd => fd.id === folder.id ? { ...fd, synced: e.target.checked } : fd))
                  }} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setAutoUploadOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={() => setAutoUploadOpen(false)}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Sync Settings Dialog */}
      <Dialog open={syncSettingsOpen} onClose={() => setSyncSettingsOpen(false)} fullWidth maxWidth="xs">
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Sync Settings</Typography>
          <Stack spacing={3}>
            <ListItem disablePadding>
              <ListItemText primary={<Typography fontWeight={600}>Auto Sync</Typography>} />
              <Switch checked={autoSyncEnabled} onChange={(e) => setAutoSyncEnabled(e.target.checked)} />
            </ListItem>
            {!autoSyncEnabled && (
              <Button variant="contained" size="large" fullWidth startIcon={<CloudUploadIcon />}>
                Press to sync phone image files
              </Button>
            )}
          </Stack>
        </Box>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setSyncSettingsOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={() => setSyncSettingsOpen(false)}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Photo Viewer */}
      {viewerIndex !== null && (
        <PhotoViewer 
          files={files} 
          initialIndex={viewerIndex} 
          onClose={() => setViewerIndex(null)} 
          onDeleted={() => {
            loadPhotos()
            setViewerIndex(null)
          }}
        />
      )}
    </Box>
  )
}

function PhotoItem({ file, onClick }: { file: any, onClick: () => void }) {
  const [url, setUrl] = useState(file.thumbnailLink || '')

  useEffect(() => {
    if (url) return 
    apiFetch<{ path: string }>(`/files/${file.id}/preview-token`, { method: 'POST' })
      .then(res => {
        setUrl(`${API_URL}${res.path}`)
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

function PhotoViewer({ files, initialIndex, onClose, onDeleted }: { files: any[], initialIndex: number, onClose: () => void, onDeleted: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const file = files[currentIndex]
  
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  
  const [touchStart, setTouchStart] = useState<number | null>(null)

  useEffect(() => {
    // Preload current, previous and next
    const indicesToLoad = [currentIndex - 1, currentIndex, currentIndex + 1].filter(i => i >= 0 && i < files.length)
    
    indicesToLoad.forEach(i => {
      const f = files[i]
      if (!urls[f.id]) {
        apiFetch<{ path: string }>(`/files/${f.id}/preview-token`, { method: 'POST' })
          .then(res => {
            setUrls(prev => ({ ...prev, [f.id]: `${API_URL}${res.path}` }))
          })
          .catch(console.error)
      }
    })
  }, [currentIndex, files, urls])

  const handlePrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1) }
  const handleNext = () => { if (currentIndex < files.length - 1) setCurrentIndex(currentIndex + 1) }

  const onTouchStartEvent = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX)
  const onTouchEndEvent = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0].clientX
    const distance = touchStart - touchEnd
    if (distance > 50) handleNext() // Swipe left (next)
    if (distance < -50) handlePrev() // Swipe right (prev)
    setTouchStart(null)
  }

  const handleTrash = async () => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return
    try {
      await apiFetch(`/files/${file.id}`, { method: 'DELETE' })
      onDeleted()
    } catch (e) {
      console.error(e)
      alert('Failed to delete photo')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: file.name, url: window.location.href })
      } catch (e) {
        console.error(e)
      }
    } else {
      alert('Share is not supported on this browser.')
    }
  }

  const handleMenuClick = (action: string) => {
    setAnchorEl(null)
    const url = urls[file.id]
    if (action === 'Copy Link') {
      navigator.clipboard.writeText(url || window.location.href)
      alert('Link copied to clipboard')
    } else if (action === 'About') {
      setAboutOpen(true)
    } else if (action === 'Google Lens') {
      if (url) window.open('https://lens.google.com/uploadbyurl?url=' + encodeURIComponent(url), '_blank')
    } else if (action === 'Print') {
      if (url) {
        const w = window.open('')
        if (w) w.document.write(`<img src="${url}" style="max-width:100%;" onload="window.print();window.close()" />`)
      }
    } else if (action === 'Use as') {
      window.open(`${API_URL}/files/${file.id}/download`, '_blank')
    }
  }

  const handleEdit = () => {
    const url = urls[file.id]
    if (url) window.open('https://pixlr.com/editor/?image=' + encodeURIComponent(url), '_blank')
  }

  const dateStr = file.createdAt ? new Date(file.createdAt).toLocaleString(undefined, { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'Unknown date'

  return (
    <Dialog fullScreen open PaperProps={{ sx: { bgcolor: 'black', color: 'white', overflow: 'hidden' } }}>
      {/* Top Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, bgcolor: 'rgba(0,0,0,0.5)' }}>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, ml: 2, overflow: 'hidden' }}>
          <Typography variant="body1" noWrap fontWeight={700}>{file.name}</Typography>
          <Typography variant="caption" noWrap sx={{ opacity: 0.7 }}>{dateStr}</Typography>
        </Box>
        <IconButton sx={{ color: 'white' }} onClick={() => alert('Starred')}>
          <StarBorderIcon />
        </IconButton>
      </Box>

      {/* Swipeable Image Area */}
      <Box 
        sx={{ flex: 1, position: 'relative', mt: 7, mb: 7, overflow: 'hidden' }}
        onTouchStart={onTouchStartEvent}
        onTouchEnd={onTouchEndEvent}
      >
        <Box sx={{
          display: 'flex',
          height: '100%',
          width: `${files.length * 100}%`,
          transform: `translateX(-${(currentIndex / files.length) * 100}%)`,
          transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
        }}>
          {files.map((f, i) => (
            <Box key={f.id} sx={{ width: `${100 / files.length}%`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {Math.abs(i - currentIndex) <= 1 ? (
                urls[f.id] ? (
                  <img
                    src={urls[f.id]}
                    alt={f.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <CircularProgress sx={{ color: 'white' }} />
                )
              ) : null}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Bottom Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', p: 1, position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, bgcolor: 'rgba(0,0,0,0.5)' }}>
        <Box onClick={handleShare} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 }, p: 1, minWidth: 64 }}>
          <ShareIcon fontSize="small" />
          <Typography variant="caption" sx={{ mt: 0.5, lineHeight: 1 }}>Share</Typography>
        </Box>
        <Box onClick={handleEdit} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 }, p: 1, minWidth: 64 }}>
          <EditIcon fontSize="small" />
          <Typography variant="caption" sx={{ mt: 0.5, lineHeight: 1 }}>Edit</Typography>
        </Box>
        <Box onClick={handleTrash} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 }, p: 1, minWidth: 64 }}>
          <DeleteIcon fontSize="small" />
          <Typography variant="caption" sx={{ mt: 0.5, lineHeight: 1 }}>Trash</Typography>
        </Box>
        <Box onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 }, p: 1, minWidth: 64 }}>
          <MoreVertIcon fontSize="small" />
          <Typography variant="caption" sx={{ mt: 0.5, lineHeight: 1 }}>More</Typography>
        </Box>
      </Box>

      {/* More Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MenuItem onClick={() => handleMenuClick('About')}>
          <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
          <ListItemText>About</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuClick('Google Lens')}>
          <ListItemIcon><SearchIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Google Lens</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuClick('Copy Link')}>
          <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuClick('Print')}>
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuClick('Use as')}>
          <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Use as</ListItemText>
        </MenuItem>
      </Menu>

      {/* About Dialog */}
      <Dialog open={aboutOpen} onClose={() => setAboutOpen(false)} PaperProps={{ sx: { bgcolor: 'background.paper', color: 'text.primary', minWidth: 300 } }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Details</Typography>
          <Typography variant="body2" color="text.secondary">Name</Typography>
          <Typography variant="body1" sx={{ mb: 1, wordBreak: 'break-all' }}>{file.name}</Typography>
          <Typography variant="body2" color="text.secondary">Date</Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>{dateStr}</Typography>
          <Typography variant="body2" color="text.secondary">Size</Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>{file.sizeBytes ? (file.sizeBytes / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</Typography>
          <Typography variant="body2" color="text.secondary">Type</Typography>
          <Typography variant="body1">{file.mimeType}</Typography>
        </Box>
        <DialogActions>
          <Button onClick={() => setAboutOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}
