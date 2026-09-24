import { useState, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import { apiFetch } from '@/lib/api'
import { useUpload } from '@/context/UploadContext'
import { useDriveLayoutActions } from '@/layouts/DriveLayout'

export function PhotosPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadProgress, uploadFiles } = useUpload()
  const { setHeaderActions } = useDriveLayoutActions()
  const theme = useTheme()
  const matchDownSm = useMediaQuery(theme.breakpoints.down('sm'))
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'))

  const cols = matchDownSm ? 2 : matchDownMd ? 3 : 5

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
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: { xs: 2, sm: 4 }, overflowY: 'auto' }}>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

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
          <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>Gallery</Typography>
          <ImageList variant="masonry" cols={cols} gap={16}>
            {files.map((file) => (
              <PhotoItem key={file.id} file={file} />
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
    </Box>
  )
}

function PhotoItem({ file }: { file: any }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    // Get view token
    apiFetch<{ token: string }>(`/files/${file.id}/preview-token`, { method: 'POST' })
      .then(res => {
        setUrl(`${import.meta.env.VITE_API_URL}/files/preview/${res.token}`)
      })
      .catch(console.error)
  }, [file.id])

  return (
    <ImageListItem sx={{ overflow: 'hidden', borderRadius: 2, cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)', boxShadow: 4 } }}>
      {url ? (
        <img
          src={url}
          alt={file.name}
          loading="lazy"
          style={{ borderRadius: 8, display: 'block', width: '100%', height: 'auto' }}
        />
      ) : (
        <Box sx={{ height: 150, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </ImageListItem>
  )
}
