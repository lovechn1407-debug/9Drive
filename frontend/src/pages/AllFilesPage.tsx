import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import CheckIcon from '@mui/icons-material/Check'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import SyncIcon from '@mui/icons-material/Sync'
import GridViewIcon from '@mui/icons-material/GridView'
import ViewListIcon from '@mui/icons-material/ViewList'
import DownloadIcon from '@mui/icons-material/Download'
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteIcon from '@mui/icons-material/Delete'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { DummyModal } from '@/components/drive/DummyModal'
import { EmptyAreaContextMenu } from '@/components/drive/EmptyAreaContextMenu'
import { FileContextMenu } from '@/components/drive/FileContextMenu'
import { FileDetailsDrawer } from '@/components/drive/FileDetailsDrawer'
import { FileGrid } from '@/components/drive/FileGrid'
import { FileTable } from '@/components/drive/FileTable'
import { FolderContextMenu } from '@/components/drive/FolderContextMenu'
import { FolderGrid, type FolderSizeScale } from '@/components/drive/FolderGrid'
import { defaultFolderColor, defaultFolderIconUrl, folderColorOptions, folderIconOptions, normalizeFolderColor } from '@/components/drive/FolderVisual'
import { PageHeader } from '@/components/drive/PageHeader'
import { API_URL, apiFetch, formatBytes, formatDate } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import { createPlyr, ensurePlyr } from '@/lib/plyr'
import { getPreviewKind, officeViewerUrl } from '@/lib/preview'
import type { FileItem, FolderItem } from '@/data/drive-data'
import { useUpload } from '@/context/UploadContext'
import { useDriveLayoutActions } from '@/layouts/DriveLayout'
import { isNativeMobile, requestMobileStoragePermission } from '@/lib/nativeStorage'

type BackendFile = { id: string; name: string; mimeType: string; sizeBytes: string; createdAt: string; folderId?: string | null; connectedAccount?: { email: string; provider: string }; folder?: { id: string; name: string } | null }
type BackendFolder = { id: string; name: string; color: string; iconUrl?: string | null; parentId?: string | null; providerFolderId?: string | null; updatedAt: string }
type ConnectedAccount = { id: string; provider: string; email: string; displayName?: string | null; status: string }
type FileViewMode = 'list' | 'grid'

const fileViewStorageKey = '9drive:all-files-view-mode'

function getStoredFileViewMode(): FileViewMode {
  const stored = localStorage.getItem(fileViewStorageKey)
  return stored === 'grid' || stored === 'list' ? stored : 'list'
}

function mimeToKind(mimeType: string): FileItem['kind'] {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('pdf')) return 'pdf'
  return 'doc'
}

function providerLabel(provider: string | undefined) { return provider === 's3' ? 'S3 Storage' : 'Google Drive' }

function mapFile(file: BackendFile): FileItem {
  return { id: file.id, name: file.name, mimeType: file.mimeType, sizeBytes: file.sizeBytes, createdAt: file.createdAt, accountEmail: file.connectedAccount?.email, accountProvider: providerLabel(file.connectedAccount?.provider), date: formatDate(file.createdAt), size: formatBytes(file.sizeBytes), access: file.connectedAccount?.email ?? providerLabel(file.connectedAccount?.provider), kind: mimeToKind(file.mimeType), shared: 1, folderId: file.folderId, folderName: file.folder?.name }
}

function mapFolder(folder: BackendFolder): FolderItem {
  return { id: folder.id, name: folder.name, color: folder.color, iconUrl: folder.iconUrl, parentId: folder.parentId, providerFolderId: folder.providerFolderId, updated: `Updated ${formatDate(folder.updatedAt)}` , rawDate: folder.updatedAt } as any
}

function FolderAppearanceFields({ color, iconUrl, onColorChange, onIconChange }: { color: string; iconUrl: string; onColorChange: (color: string) => void; onIconChange: (iconUrl: string) => void }) {
  const normalizedColor = normalizeFolderColor(color)
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Folder Color</Typography>
        <Stack direction="row" flexWrap="wrap" spacing={1}>
          <input type="color" value={normalizedColor} onChange={(e) => onColorChange(e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} />
          {folderColorOptions.map((option) => (
            <Box
              key={option}
              onClick={() => onColorChange(option)}
              sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: option, cursor: 'pointer', border: normalizedColor === option ? 2 : 1, borderColor: normalizedColor === option ? 'primary.main' : 'divider', transition: 'transform 0.1s', '&:hover': { transform: 'scale(1.1)' } }}
              aria-label={`Use ${option} color`}
            />
          ))}
        </Stack>
      </Box>
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Folder Icon</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 1 }}>
          {folderIconOptions.map((option) => (
            <Box
              key={option.url}
              onClick={() => onIconChange(option.url)}
              sx={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, cursor: 'pointer', border: iconUrl === option.url ? 2 : 1, borderColor: iconUrl === option.url ? 'primary.main' : 'divider', bgcolor: iconUrl === option.url ? 'primary.light' : 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
              title={option.label}
            >
              <img src={`${option.url}?color=${encodeURIComponent(normalizedColor)}`} alt="" style={{ width: 24, height: 24 }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  )
}

export function AllFilesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeFolderId = searchParams.get('folderId')
  const searchQuery = searchParams.get('q')?.trim() ?? ''
  
  const [uploadOpen, setUploadOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [folderRenameOpen, setFolderRenameOpen] = useState(false)
  const [folderDeleteOpen, setFolderDeleteOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  
  const [shareUrl, setShareUrl] = useState('')
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null)
  const [foldersOnTop, setFoldersOnTop] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [allFolders, setAllFolders] = useState<FolderItem[]>([])
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [isUploadDragging, setIsUploadDragging] = useState(false)
  
  const [folderName, setFolderName] = useState('')
  const [folderColor, setFolderColor] = useState(defaultFolderColor)
  const [folderIconUrl, setFolderIconUrl] = useState(defaultFolderIconUrl)
  
  const [renameValue, setRenameValue] = useState('')
  const [folderRenameValue, setFolderRenameValue] = useState('')
  const [folderRenameColor, setFolderRenameColor] = useState(defaultFolderColor)
  const [folderRenameIconUrl, setFolderRenameIconUrl] = useState(defaultFolderIconUrl)
  
  const [activeFile, setActiveFile] = useState<FileItem | null>(null)
  const [activeFolderForMenu, setActiveFolderForMenu] = useState<FolderItem | null>(null)
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [cutFolder, setCutFolder] = useState<FolderItem | null>(null)
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem | null }>({ x: 0, y: 0, file: null })
  const [folderContextMenu, setFolderContextMenu] = useState<{ x: number; y: number; folder: FolderItem | null }>({ x: 0, y: 0, folder: null })
  const [emptyContextMenu, setEmptyContextMenu] = useState<{ x: number; y: number; open: boolean }>({ x: 0, y: 0, open: false })
  
  const [message, setMessage] = useState('')
  const [gdrivePublicUrl, setGdrivePublicUrl] = useState('')
  const [makingPublic, setMakingPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncingDrive, setSyncingDrive] = useState(false)
  const [fileViewMode, setFileViewMode] = useState<FileViewMode>(getStoredFileViewMode)
  
  const { uploadFiles, uploadProgress } = useUpload()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviteTargetType, setInviteTargetType] = useState<'file' | 'folder'>('file')
  const [inviteTargetId, setInviteTargetId] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviting, setInviting] = useState(false)
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)
  const [folderSizeScale, setFolderSizeScale] = useState<FolderSizeScale>(() => {
    const v = localStorage.getItem('9drive:folder-size')
    return (v === 'xs' || v === 'sm' || v === 'md' || v === 'lg') ? v : 'md'
  })
  
  const { setHeaderActions } = useDriveLayoutActions()
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [selectedTargetAccountId, setSelectedTargetAccountId] = useState('')

  function changeFolderSize(scale: FolderSizeScale) {
    setFolderSizeScale(scale)
    localStorage.setItem('9drive:folder-size', scale)
  }

  async function loadFiles() {
    const params = new URLSearchParams()
    if (activeFolderId) params.set('folderId', activeFolderId)
    if (searchQuery) params.set('q', searchQuery)
    const kind = searchParams.get('kind'); const accountId = searchParams.get('accountId'); const minSize = searchParams.get('minSize'); const maxSize = searchParams.get('maxSize'); const startDate = searchParams.get('startDate'); const endDate = searchParams.get('endDate')
    if (kind) params.set('kind', kind); if (accountId) params.set('accountId', accountId); if (minSize) params.set('minSize', minSize); if (maxSize) params.set('maxSize', maxSize); if (startDate) params.set('startDate', startDate); if (endDate) params.set('endDate', endDate)
    const query = params.toString()
    const path = query ? `/files?${query}` : '/files'
    const data = await apiFetch<{ files: BackendFile[] }>(path)
    setFiles(data.files.map(mapFile))
  }

  async function loadFolders() {
    const visiblePath = activeFolderId ? `/folders?parentId=${activeFolderId}` : '/folders'
    const [visibleData, allData] = await Promise.all([
      apiFetch<{ folders: BackendFolder[] }>(visiblePath),
      apiFetch<{ folders: BackendFolder[] }>('/folders?all=1'),
    ])
    setFolders(visibleData.folders.map(mapFolder))
    setAllFolders(allData.folders.map(mapFolder))
  }

  async function loadAll() { await Promise.all([loadFiles(), loadFolders()]) }

  async function handleDropItem(fileId: string, targetFolderId: string) {
    const fileIds = selectedFileIds.has(fileId) ? Array.from(selectedFileIds) : [fileId]
    setLoading(true); setMessage('')
    try {
      await apiFetch('/files/batch', { method: 'PATCH', body: JSON.stringify({ fileIds, folderId: targetFolderId }) })
      setMessage(`Successfully moved ${fileIds.length} item(s).`)
      loadAll().catch(() => undefined)
      setSelectedFileIds(new Set())
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Failed to move items') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadAll().catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load files'))
    setSelectedFileIds(new Set())
  }, [activeFolderId, searchQuery, searchParams])

  useEffect(() => {
    async function loadConnectedAccounts() {
      try {
        const data = await apiFetch<{ accounts: ConnectedAccount[] }>('/connected-accounts')
        setConnectedAccounts(data.accounts || [])
      } catch (error) { console.error('Failed to load connected accounts:', error) }
    }
    loadConnectedAccounts()
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { setContextMenu({ x: 0, y: 0, file: null }); setFolderContextMenu({ x: 0, y: 0, folder: null }); setEmptyContextMenu({ x: 0, y: 0, open: false }) }
      if (event.ctrlKey && event.key.toLowerCase() === 'x' && activeFolderForMenu) { event.preventDefault(); cutSelectedFolder(activeFolderForMenu) }
      if (event.ctrlKey && event.key.toLowerCase() === 'v' && cutFolder) { event.preventDefault(); pasteFolder().catch((e) => setMessage(e instanceof Error ? e.message : 'Failed to paste')) }
    }
    function onOpenMoveShortcut(e: Event) {
      const file = (e as CustomEvent).detail as FileItem
      setActiveFile(file); setSelectedFolderId(file.folderId || ''); setMoveOpen(true)
    }
    window.addEventListener('keydown', onKey); window.addEventListener('9drive:open-move-modal', onOpenMoveShortcut)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('9drive:open-move-modal', onOpenMoveShortcut) }
  }, [activeFolderForMenu, cutFolder, activeFolderId])

  useEffect(() => {
    if (previewOpen && previewVideoRef.current) { ensurePlyr(); createPlyr(previewVideoRef.current) }
  }, [previewOpen, previewUrl])

  async function syncGoogleDrive() {
    setSyncingDrive(true); setMessage('')
    try {
      const data = await apiFetch<{ added: number; updated: number; deleted: number; message: string }>('/files/sync-google', { method: 'POST' })
      setMessage(data.message)
      await loadAll()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Failed to sync Google Drive files') }
    finally { setSyncingDrive(false) }
  }

  function handleUploadDrag(event: React.DragEvent) {
    event.preventDefault(); event.stopPropagation()
    if (event.type === 'dragenter' || event.type === 'dragover') setIsUploadDragging(true)
    else if (event.type === 'dragleave') setIsUploadDragging(false)
    if (event.type === 'drop') {
      setIsUploadDragging(false)
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        setSelectedFiles(Array.from(event.dataTransfer.files))
      }
    }
  }

  function selectUploadFiles(fileList: FileList | null) {
    if (fileList && fileList.length > 0) setSelectedFiles(Array.from(fileList))
  }

  function removeUploadFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function uploadFile(event: FormEvent) {
    event.preventDefault()
    if (selectedFiles.length === 0) return
    setUploadOpen(false)
    const targetFolderId = activeFolderId || selectedFolderId || undefined
    const accountId = selectedTargetAccountId || undefined
    uploadFiles(selectedFiles, targetFolderId, accountId)
    setSelectedFiles([]); setFolderName(''); setSelectedFolderId(''); setSelectedTargetAccountId('')
  }

  async function createFolder(event: FormEvent) {
    event.preventDefault()
    try {
      await apiFetch('/folders', { method: 'POST', body: JSON.stringify({ name: folderName, parentId: activeFolderId || undefined, color: folderColor, iconUrl: folderIconUrl }) })
      setFolderOpen(false); setFolderName(''); setFolderColor(defaultFolderColor); setFolderIconUrl(defaultFolderIconUrl)
      await loadFolders()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Failed to create folder') }
  }

  function openContext(event: MouseEvent<HTMLElement>, file: FileItem) {
    event.preventDefault(); event.stopPropagation()
    setActiveFile(file)
    setContextMenu({ x: event.clientX, y: event.clientY, file })
  }

  function toggleFileSelection(file: FileItem) {
    if (!file.id) return
    setSelectedFileIds((current) => {
      const next = new Set(current); if (next.has(file.id!)) next.delete(file.id!); else next.add(file.id!)
      return next
    })
  }

  function toggleAllVisibleFiles() {
    const visibleIds = files.map((file) => file.id).filter(Boolean) as string[]
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedFileIds.has(id))
    setSelectedFileIds(allSelected ? new Set() : new Set(visibleIds))
  }

  function clearSelection() { setSelectedFileIds(new Set()) }

  function changeFileViewMode(mode: FileViewMode) { setFileViewMode(mode); localStorage.setItem(fileViewStorageKey, mode) }

  function openFolderMenu(event: MouseEvent<HTMLElement>, folder: FolderItem) {
    event.preventDefault(); event.stopPropagation()
    setActiveFolderForMenu(folder)
    setFolderContextMenu({ x: event.clientX, y: event.clientY, folder })
  }

  function openFolder(folder: FolderItem) {
    if (!folder.id) return
    setSearchParams(searchQuery ? { folderId: folder.id, q: searchQuery } : { folderId: folder.id })
  }
  function openFolderById(folderId: string) { setSearchParams(searchQuery ? { folderId, q: searchQuery } : { folderId }) }
  function openEmptyContextMenu(event: MouseEvent<HTMLElement>) { event.preventDefault(); setEmptyContextMenu({ x: event.clientX, y: event.clientY, open: true }) }
  function closeFolder() { setSearchParams(searchQuery ? { q: searchQuery } : {}) }

  async function viewFile() {
    if (!activeFile?.id) return
    setPreviewUrl(''); setPreviewError(''); setPreviewLoading(true); setPreviewOpen(true); setContextMenu({ x: 0, y: 0, file: null })
    try {
      const data = await apiFetch<{ path?: string; url: string }>(`/files/${activeFile.id}/preview-token`, { method: 'POST' })
      const previewPath = data.path ?? new URL(data.url).pathname
      setPreviewUrl(`${API_URL}${previewPath}`)
    } catch (error) { setPreviewError(error instanceof Error ? error.message : 'Failed to load preview') }
    finally { setPreviewLoading(false) }
  }

  async function downloadFile() {
    if (!activeFile?.id) return
    const response = await fetch(`${API_URL}/files/${activeFile.id}/download`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
    if (!response.ok) throw new Error('Download failed')
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a')
    link.href = url; link.download = activeFile.name; link.click(); URL.revokeObjectURL(url)
    setContextMenu({ x: 0, y: 0, file: null })
  }

  async function downloadBatchAsZip() {
    const selectedIds = [...selectedFileIds]
    if (selectedIds.length === 0) return
    setLoading(true); setMessage('')
    try {
      const response = await fetch(`${API_URL}/files/batch-download`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAccessToken()}` },
        body: JSON.stringify({ fileIds: selectedIds })
      })
      if (!response.ok) throw new Error('Failed to download ZIP file')
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a')
      link.href = url; link.download = '9drive-download.zip'; link.click(); URL.revokeObjectURL(url)
      clearSelection(); setMessage('Batch download complete.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Batch download failed') }
    finally { setLoading(false) }
  }

  async function renameFile(event: FormEvent) {
    event.preventDefault(); if (!activeFile?.id) return
    await apiFetch(`/files/${activeFile.id}`, { method: 'PATCH', body: JSON.stringify({ name: renameValue }) })
    setRenameOpen(false); await loadFiles()
  }

  async function moveFile(event: FormEvent) {
    event.preventDefault()
    const selectedIds = [...selectedFileIds]
    if (selectedIds.length > 0) await apiFetch('/files/batch', { method: 'PATCH', body: JSON.stringify({ fileIds: selectedIds, folderId: selectedFolderId || null }) })
    else if (activeFile?.id) await apiFetch(`/files/${activeFile.id}`, { method: 'PATCH', body: JSON.stringify({ folderId: selectedFolderId || null }) })
    else return
    setMoveOpen(false); setSelectedFolderId(''); clearSelection(); await loadFiles()
  }

  async function deleteFile() {
    const selectedIds = [...selectedFileIds]
    if (selectedIds.length > 0) await apiFetch('/files/batch', { method: 'DELETE', body: JSON.stringify({ fileIds: selectedIds }) })
    else if (activeFile?.id) await apiFetch(`/files/${activeFile.id}`, { method: 'DELETE' })
    else return
    setDeleteOpen(false); clearSelection(); await loadFiles(); window.dispatchEvent(new Event('9drive:storage-changed'))
  }

  async function shareFile() {
    if (!activeFile?.id) return
    const data = await apiFetch<{ url: string }>(`/files/${activeFile.id}/share`, { method: 'POST' })
    setShareUrl(data.url); setCopiedShareLink(false); setGdrivePublicUrl(''); setMakingPublic(false)
    setShareOpen(true); setContextMenu({ x: 0, y: 0, file: null })
  }

  async function copyShareLinkDirect() {
    if (!activeFile?.id) return
    try {
      const data = await apiFetch<{ url: string | null }>(`/files/${activeFile.id}/view-url`)
      if (data.url) {
        await navigator.clipboard.writeText(data.url)
        setMessage('Google Drive link copied to clipboard!'); setTimeout(() => setMessage(''), 2500)
      } else {
        const shareData = await apiFetch<{ url: string }>(`/files/${activeFile.id}/share`, { method: 'POST' })
        await navigator.clipboard.writeText(shareData.url)
        setMessage('Share link copied to clipboard!'); setTimeout(() => setMessage(''), 2500)
      }
    } catch (err: any) {
      setMessage('Failed to copy link: ' + (err.message || err)); setTimeout(() => setMessage(''), 2500)
    }
    setContextMenu({ x: 0, y: 0, file: null })
  }

  async function inviteToFile() {
    if (!activeFile?.id) return
    setInviteTargetType('file'); setInviteTargetId(activeFile.id); setInviteOpen(true); setContextMenu({ x: 0, y: 0, file: null })
  }

  async function inviteToFolder() {
    if (!activeFolderForMenu?.id) return
    setInviteTargetType('folder'); setInviteTargetId(activeFolderForMenu.id); setInviteOpen(true); setFolderContextMenu({ x: 0, y: 0, folder: null })
  }

  async function copyFolderLink() {
    if (!activeFolderForMenu?.id) return
    let url = `${window.location.origin}/all-files?folderId=${activeFolderForMenu.id}`
    if (activeFolderForMenu.providerFolderId) url = `https://drive.google.com/open?id=${activeFolderForMenu.providerFolderId}`
    await navigator.clipboard.writeText(url)
    setMessage('Folder link copied to clipboard!'); setTimeout(() => setMessage(''), 2500)
    setFolderContextMenu({ x: 0, y: 0, folder: null })
  }

  async function sendInvite(event: FormEvent) {
    event.preventDefault(); if (!inviteTargetId) return
    setInviting(true); setInviteMessage('')
    try {
      await apiFetch('/invites', { method: 'POST', body: JSON.stringify({ email: inviteEmail, role: inviteRole, targetType: inviteTargetType, targetId: inviteTargetId }) })
      setInviteEmail(''); setInviteRole('viewer'); setInviteMessage('Invite saved. Member will appear in Shared.')
      window.dispatchEvent(new Event('9drive:invites-changed'))
    } catch (error) { setInviteMessage(error instanceof Error ? error.message : 'Failed to send invite') }
    finally { setInviting(false) }
  }

  async function copyShareLink() { await navigator.clipboard.writeText(shareUrl); setCopiedShareLink(true); window.setTimeout(() => setCopiedShareLink(false), 1600) }

  async function renameFolder(event: FormEvent) {
    event.preventDefault(); if (!activeFolderForMenu?.id) return
    await apiFetch(`/folders/${activeFolderForMenu.id}`, { method: 'PATCH', body: JSON.stringify({ name: folderRenameValue, color: folderRenameColor, iconUrl: folderRenameIconUrl }) })
    setFolderRenameOpen(false); await loadFolders()
  }

  async function deleteFolder() {
    if (!activeFolderForMenu?.id) return
    await apiFetch(`/folders/${activeFolderForMenu.id}`, { method: 'DELETE' }); setFolderDeleteOpen(false); await loadFolders()
  }

  function cutSelectedFolder(folder: FolderItem | null) {
    if (!folder?.id) return
    setCutFolder(folder); setFolderContextMenu({ x: 0, y: 0, folder: null })
    setMessage(`Folder "${folder.name}" ready to move. Open target folder and press Ctrl+V.`)
  }

  async function pasteFolder() {
    if (!cutFolder?.id) return
    await apiFetch(`/folders/${cutFolder.id}`, { method: 'PATCH', body: JSON.stringify({ parentId: activeFolderId ?? null }) })
    setMessage(`Folder "${cutFolder.name}" moved.`); setCutFolder(null); await loadFolders()
  }

  function closePreview() { setPreviewUrl(''); setPreviewError(''); setPreviewLoading(false); setPreviewOpen(false) }

  useEffect(() => {
    function handleUploadCompleted() { loadAll().catch(() => undefined) }
    window.addEventListener('9drive:upload-completed', handleUploadCompleted)
    return () => window.removeEventListener('9drive:upload-completed', handleUploadCompleted)
  }, [activeFolderId])

  useEffect(() => {
    setHeaderActions(
      <Stack direction="row" alignItems="center" spacing={1}>
        <ToggleButtonGroup size="small" value={folderSizeScale} exclusive onChange={(e, v) => v && changeFolderSize(v)} sx={{ display: { xs: 'none', md: 'flex' } }}>
          {(['xs', 'sm', 'md', 'lg'] as FolderSizeScale[]).map((s) => (
            <ToggleButton key={s} value={s} sx={{ px: 1.5, py: 0.5, fontSize: '0.7rem', fontWeight: 700 }}>
              {s.toUpperCase()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Divider orientation="vertical" variant="middle" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 1 }} />
        <Button size="small" variant="contained" startIcon={<CloudUploadIcon />} onClick={() => setUploadOpen(true)}>Upload</Button>
        <Button size="small" variant="outlined" startIcon={<CreateNewFolderIcon />} onClick={() => setFolderOpen(true)}>New Folder</Button>
        <Button size="small" variant="outlined" disabled={syncingDrive} onClick={syncGoogleDrive} startIcon={syncingDrive ? <CircularProgress size={16} /> : <SyncIcon />}>
          {syncingDrive ? 'Syncing' : 'Sync'}
        </Button>
      </Stack>
    )
  }, [syncingDrive, folderSizeScale])

  const activeFolder = allFolders.find((folder) => folder.id === activeFolderId)
  const folderBreadcrumbs = (() => {
    if (!activeFolder) return []
    const foldersById = new Map(allFolders.map((folder) => [folder.id, folder]))
    const path: FolderItem[] = []; const visited = new Set<string>(); let current: FolderItem | undefined = activeFolder
    while (current?.id && !visited.has(current.id)) { path.unshift(current); visited.add(current.id); current = current.parentId ? foldersById.get(current.parentId) : undefined }
    return path
  })()
  const allVisibleSelected = files.length > 0 && files.every((file) => file.id && selectedFileIds.has(file.id))
  const activePreviewKind = getPreviewKind(activeFile?.mimeType)

    const filteredFolders = typeFilter === 'all' || typeFilter === 'folders' ? folders : []
  const filteredFiles = typeFilter === 'folders' ? [] 
    : typeFilter === 'all' || typeFilter === 'files' ? files 
    : files.filter(f => f.kind === typeFilter)

    const sortedFolders = [...filteredFolders].sort((a: any, b: any) => {
    let diff = 0
    if (sortBy === 'name' || sortBy === 'size') diff = a.name.localeCompare(b.name)
    else if (sortBy === 'date') diff = new Date(a.rawDate || 0).getTime() - new Date(b.rawDate || 0).getTime()
    return sortDir === 'asc' ? diff : -diff
  })

  const sortedFiles = [...filteredFiles].sort((a: any, b: any) => {
    let diff = 0
    if (sortBy === 'name') diff = a.name.localeCompare(b.name)
    else if (sortBy === 'date') diff = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    else if (sortBy === 'size') diff = (Number(a.sizeBytes) || 0) - (Number(b.sizeBytes) || 0)
    return sortDir === 'asc' ? diff : -diff
  })

  return (
    <>
      <Box onContextMenu={openEmptyContextMenu} sx={{ minHeight: 620, width: '100%', minWidth: 0, pb: 4 }}>
        <PageHeader 
          title={
            activeFolder ? (
              <Breadcrumbs aria-label="breadcrumb">
                <Link component="button" variant="h5" fontWeight={700} underline="hover" color="inherit" onClick={closeFolder}>All Files</Link>
                {folderBreadcrumbs.map((folder, index) => (
                  index === folderBreadcrumbs.length - 1 ? (
                    <Typography key={folder.id} variant="h5" fontWeight={700} color="text.primary">{folder.name}</Typography>
                  ) : (
                    <Link key={folder.id} component="button" variant="h5" fontWeight={700} underline="hover" color="inherit" onClick={() => folder.id && openFolderById(folder.id)}>
                      {folder.name}
                    </Link>
                  )
                ))}
              </Breadcrumbs>
            ) : 'All Files'
          } 
        />
        
        {/* Mobile quick actions */}
        <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 2, display: { md: 'none' } }}>
          <Button size="small" variant="contained" startIcon={<CloudUploadIcon />} onClick={() => setUploadOpen(true)}>Upload</Button>
          <Button size="small" variant="outlined" startIcon={<CreateNewFolderIcon />} onClick={() => setFolderOpen(true)}>New Folder</Button>
          <Button size="small" variant="outlined" disabled={syncingDrive} onClick={syncGoogleDrive} startIcon={syncingDrive ? <CircularProgress size={16} /> : <SyncIcon />}>
            Sync
          </Button>
        </Stack>

        {message && <Alert severity="info" sx={{ mt: 2 }} onClose={() => setMessage('')}>{message}</Alert>}
        


        {/* Toolbar */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mt: 4, mb: 2, width: '100%' }}>
          <Stack direction="row" flexWrap="wrap" spacing={1} alignItems="center" sx={{ flexGrow: 1 }}>
<Box>
                <Button 
                  onClick={(e) => setSortAnchorEl(e.currentTarget)} 
                  sx={{ textTransform: 'none', fontWeight: 500, color: 'text.primary', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 2 }}
                >
                  {sortBy === 'name' ? 'Name' : sortBy === 'date' ? 'Date modified' : 'Size'}
                  <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.light', color: 'primary.dark', borderRadius: '50%', width: 24, height: 24, flexShrink: 0 }}>
                    {sortDir === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />}
                  </Box>
                </Button>
                <Menu 
                  anchorEl={sortAnchorEl} 
                  open={Boolean(sortAnchorEl)} 
                  onClose={() => setSortAnchorEl(null)}
                  PaperProps={{ sx: { width: 260, borderRadius: 2, mt: 1, boxShadow: 3 } }}
                >
                  <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '36px' }}>Sort by</ListSubheader>
                  <MenuItem onClick={() => { setSortBy('name'); setSortAnchorEl(null); }}>
                    <ListItemIcon>{sortBy === 'name' ? <CheckIcon fontSize="small"/> : null}</ListItemIcon>
                    <ListItemText>Name</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { setSortBy('date'); setSortAnchorEl(null); }}>
                    <ListItemIcon>{sortBy === 'date' ? <CheckIcon fontSize="small"/> : null}</ListItemIcon>
                    <ListItemText>Date modified</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { setSortBy('size'); setSortAnchorEl(null); }}>
                    <ListItemIcon>{sortBy === 'size' ? <CheckIcon fontSize="small"/> : null}</ListItemIcon>
                    <ListItemText>Size</ListItemText>
                  </MenuItem>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '36px' }}>Sort direction</ListSubheader>
                  <MenuItem onClick={() => { setSortDir('asc'); setSortAnchorEl(null); }}>
                    <ListItemIcon>{sortDir === 'asc' ? <CheckIcon fontSize="small"/> : null}</ListItemIcon>
                    <ListItemText>{sortBy === 'name' ? 'A to Z' : sortBy === 'date' ? 'Oldest first' : 'Smallest first'}</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { setSortDir('desc'); setSortAnchorEl(null); }}>
                    <ListItemIcon>{sortDir === 'desc' ? <CheckIcon fontSize="small"/> : null}</ListItemIcon>
                    <ListItemText>{sortBy === 'name' ? 'Z to A' : sortBy === 'date' ? 'Newest first' : 'Largest first'}</ListItemText>
                  </MenuItem>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '36px' }}>Folders</ListSubheader>
                  <MenuItem onClick={() => { setFoldersOnTop(true); setSortAnchorEl(null); }}>
                    <ListItemIcon>{foldersOnTop ? <CheckIcon fontSize="small"/> : null}</ListItemIcon>
                    <ListItemText>On top</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { setFoldersOnTop(false); setSortAnchorEl(null); }}>
                    <ListItemIcon>{!foldersOnTop ? <CheckIcon fontSize="small"/> : null}</ListItemIcon>
                    <ListItemText>Mixed with files</ListItemText>
                  </MenuItem>
                </Menu>
              </Box>

              

            
            {selectedFileIds.size > 0 && (
              <Paper variant="outlined" sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 9999, bgcolor: 'primary.light', borderColor: 'primary.main' }}>
                <Typography variant="body2" fontWeight={700} color="primary.dark">{selectedFileIds.size} selected</Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" onClick={downloadBatchAsZip} startIcon={<DownloadIcon />}>ZIP</Button>
                  <Button size="small" variant="outlined" color="primary" onClick={() => setMoveOpen(true)} startIcon={<DriveFileMoveIcon />}>Move</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => setDeleteOpen(true)} startIcon={<DeleteIcon />}>Delete</Button>
                  <Button size="small" variant="text" onClick={clearSelection}>Clear</Button>
                </Stack>
              </Paper>
            )}
          </Stack>
          <ToggleButtonGroup size="small" value={fileViewMode} exclusive onChange={(e, v) => v && changeFileViewMode(v)} sx={{ ml: 'auto', flexShrink: 0 }}>
            <ToggleButton value="grid" aria-label="Grid view"><GridViewIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="list" aria-label="List view"><ViewListIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {cutFolder && (
          <Alert severity="warning" icon={<ContentPasteIcon />} sx={{ mb: 2 }}>
            Cut folder: <b>{cutFolder.name}</b>. Press Ctrl+V or right-click empty area to paste here.
          </Alert>
        )}

        {files.length === 0 && folders.length === 0 ? (
          <Card variant="outlined" sx={{ mt: 2, p: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? `No items found for "${searchQuery}".` : activeFolder ? 'No items in this folder yet.' : 'No uploaded items yet. Connect Google Drive in Settings, then upload a file.'}
            </Typography>
          </Card>
        ) : (
          <Box sx={{ mt: 2 }}>
            
            {fileViewMode === 'grid' ? (
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {sortedFolders.length > 0 && (
                  <FolderGrid items={sortedFolders} mobileTwoColumns={!activeFolder} sizeScale={folderSizeScale} onFolderMenu={openFolderMenu} onFolderOpen={openFolder} onDropItem={handleDropItem} />
                )}
                {sortedFiles.length > 0 && (
                  <FileGrid files={sortedFiles} selectedFileIds={selectedFileIds} mobileTwoColumns={!activeFolder} sizeScale={folderSizeScale} onToggleFile={toggleFileSelection} onFileContextMenu={openContext} />
                )}
              </Grid>
            ) : (
              <FileTable files={sortedFiles} folders={sortedFolders} selectedFileIds={selectedFileIds} allSelected={allVisibleSelected} onToggleFile={toggleFileSelection} onToggleAll={toggleAllVisibleFiles} onFileContextMenu={openContext} onFolderContextMenu={openFolderMenu} onFolderOpen={openFolder} />
            )}
          </Box>
        )}
      </Box>

      {/* Floating Upload Button */}
      <Button
        variant="contained"
        startIcon={<CloudUploadIcon sx={{ fontSize: '1.5rem !important' }} />}
        onClick={() => setUploadOpen(true)}
        sx={{
          position: 'fixed',
          bottom: uploadProgress.open && uploadProgress.collapsed ? { xs: 164, sm: 112 } : { xs: 96, sm: 48 },
          right: { xs: 24, sm: 48 },
          boxShadow: 6,
          zIndex: 1000,
          px: 4,
          py: 2,
          fontSize: '1rem',
          fontWeight: 700,
          borderRadius: 1, // Rectangular, as requested
          opacity: uploadProgress.open && !uploadProgress.collapsed ? 0 : 1,
          transform: uploadProgress.open && !uploadProgress.collapsed ? 'scale(0.8)' : 'scale(1)',
          pointerEvents: uploadProgress.open && !uploadProgress.collapsed ? 'none' : 'auto',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        Upload
      </Button>

      {/* Context Menus */}
      <EmptyAreaContextMenu x={emptyContextMenu.x} y={emptyContextMenu.y} open={emptyContextMenu.open} canPasteFolder={Boolean(cutFolder)} onClose={() => setEmptyContextMenu({ x: 0, y: 0, open: false })} onUpload={() => { setUploadOpen(true); setEmptyContextMenu({ x: 0, y: 0, open: false }) }} onCreateFolder={() => { setFolderOpen(true); setEmptyContextMenu({ x: 0, y: 0, open: false }) }} onPasteFolder={() => { pasteFolder().catch((e) => setMessage(e instanceof Error ? e.message : 'Failed to paste')); setEmptyContextMenu({ x: 0, y: 0, open: false }) }} />
      <FileContextMenu x={contextMenu.x} y={contextMenu.y} file={contextMenu.file} onClose={() => setContextMenu({ x: 0, y: 0, file: null })} onView={viewFile} onDownload={downloadFile} onRename={() => { setRenameValue(activeFile?.name ?? ''); setRenameOpen(true); setContextMenu({ x: 0, y: 0, file: null }) }} onMove={() => { setMoveOpen(true); setContextMenu({ x: 0, y: 0, file: null }) }} onDetails={() => { setDetailOpen(true); setContextMenu({ x: 0, y: 0, file: null }) }} onShare={shareFile} onCopyLink={copyShareLinkDirect} onInvite={inviteToFile} onDelete={() => { setDeleteOpen(true); setContextMenu({ x: 0, y: 0, file: null }) }} />
      <FolderContextMenu x={folderContextMenu.x} y={folderContextMenu.y} folder={folderContextMenu.folder} onClose={() => setFolderContextMenu({ x: 0, y: 0, folder: null })} onCut={() => cutSelectedFolder(activeFolderForMenu)} onRename={() => { setFolderRenameValue(activeFolderForMenu?.name ?? ''); setFolderRenameColor(normalizeFolderColor(activeFolderForMenu?.color)); setFolderRenameIconUrl(activeFolderForMenu?.iconUrl ?? defaultFolderIconUrl); setFolderRenameOpen(true); setFolderContextMenu({ x: 0, y: 0, folder: null }) }} onInvite={inviteToFolder} onCopyLink={copyFolderLink} onDelete={() => { setFolderDeleteOpen(true); setFolderContextMenu({ x: 0, y: 0, folder: null }) }} />
      <FileDetailsDrawer open={detailOpen} file={activeFile} onClose={() => setDetailOpen(false)} />

      {/* Upload Modal */}
      <DummyModal open={uploadOpen} title="Upload File" description="Stream file directly to selected Google Drive account." onClose={() => setUploadOpen(false)}>
        <form onSubmit={uploadFile}>
          <Stack spacing={3}>
            <Box
              onDragEnter={handleUploadDrag} onDragOver={handleUploadDrag} onDragLeave={handleUploadDrag} onDrop={handleUploadDrag}
              component="label"
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center',
                border: '2px dashed', borderColor: isUploadDragging ? 'primary.main' : 'divider',
                borderRadius: 4, bgcolor: isUploadDragging ? 'primary.light' : 'background.paper', cursor: 'pointer',
                transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: isUploadDragging ? 'primary.main' : 'text.secondary', mb: 2 }} />
              <Typography variant="subtitle1" fontWeight={700}>Drop file here or click to browse</Typography>
              <Typography variant="caption" color="text.secondary">Metadata is sent before the file so upload can stream directly.</Typography>
              <input type="file" multiple onChange={(e) => selectUploadFiles(e.target.files)} style={{ display: 'none' }} required={selectedFiles.length === 0} />
            </Box>

            {isNativeMobile() && (
              <Button type="button" variant="outlined" fullWidth onClick={async () => {
                const granted = await requestMobileStoragePermission()
                setMessage(granted ? 'Device storage permission granted.' : 'Storage permission denied.')
              }}>Request Android Storage Permissions</Button>
            )}

            <FormControl fullWidth size="small">
              <InputLabel>Target Storage Account</InputLabel>
              <Select value={selectedTargetAccountId} label="Target Storage Account" onChange={(e) => setSelectedTargetAccountId(e.target.value)}>
                <MenuItem value="">Automatic (Default)</MenuItem>
                {connectedAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>{account.email || account.displayName || account.id} ({account.provider === 's3' ? 'S3' : 'Google Drive'})</MenuItem>
                ))}
              </Select>
            </FormControl>

            {activeFolder ? (
              <Alert severity="info">Uploading to: <b>{activeFolder.name}</b></Alert>
            ) : (
              <FormControl fullWidth size="small">
                <InputLabel>Virtual Folder</InputLabel>
                <Select value={selectedFolderId} label="Virtual Folder" onChange={(e) => setSelectedFolderId(e.target.value)}>
                  <MenuItem value="">No folder</MenuItem>
                  {allFolders.map((folder) => <MenuItem key={folder.id} value={folder.id}>{folder.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {selectedFiles.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflowY: 'auto', bgcolor: 'action.hover' }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="caption" fontWeight={700}>{selectedFiles.length} selected</Typography>
                  <Typography variant="caption" fontWeight={700}>{formatBytes(selectedFiles.reduce((t, f) => t + f.size, 0))}</Typography>
                </Stack>
                <Stack spacing={1}>
                  {selectedFiles.map((file, i) => (
                    <Paper key={`${file.name}-${i}`} variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" noWrap sx={{ flex: 1 }}>{file.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatBytes(file.size)}</Typography>
                      <IconButton size="small" color="error" onClick={() => removeUploadFile(i)}><CloseIcon fontSize="small" /></IconButton>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            )}

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading || selectedFiles.length === 0}>{loading ? 'Uploading...' : 'Upload'}</Button>
            </Stack>
          </Stack>
        </form>
      </DummyModal>

      {/* New Folder Modal */}
      <DummyModal open={folderOpen} title="New Folder" description="Create a virtual folder." onClose={() => setFolderOpen(false)}>
        <form onSubmit={createFolder}>
          <Stack spacing={3}>
            <TextField label="Folder Name" value={folderName} onChange={(e) => setFolderName(e.target.value)} required fullWidth />
            <FolderAppearanceFields color={folderColor} iconUrl={folderIconUrl} onColorChange={setFolderColor} onIconChange={setFolderIconUrl} />
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button onClick={() => setFolderOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Create Folder</Button>
            </Stack>
          </Stack>
        </form>
      </DummyModal>

      <DummyModal open={renameOpen} title="Rename File" description={activeFile?.name ?? ''} onClose={() => setRenameOpen(false)}>
        <form onSubmit={renameFile}>
          <Stack spacing={3}>
            <TextField fullWidth value={renameValue} onChange={(e) => setRenameValue(e.target.value)} required />
            <Stack direction="row" justifyContent="flex-end" spacing={1}><Button onClick={() => setRenameOpen(false)}>Cancel</Button><Button type="submit" variant="contained">Rename</Button></Stack>
          </Stack>
        </form>
      </DummyModal>

      <DummyModal open={moveOpen} title="Move to Folder" description={selectedFileIds.size > 0 ? `Move ${selectedFileIds.size} files` : activeFile?.name ?? ''} onClose={() => setMoveOpen(false)}>
        <form onSubmit={moveFile}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Folder</InputLabel>
              <Select value={selectedFolderId} label="Folder" onChange={(e) => setSelectedFolderId(e.target.value)}>
                <MenuItem value="">No folder</MenuItem>
                {allFolders.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Stack direction="row" justifyContent="flex-end" spacing={1}><Button onClick={() => setMoveOpen(false)}>Cancel</Button><Button type="submit" variant="contained">Move</Button></Stack>
          </Stack>
        </form>
      </DummyModal>

      <DummyModal open={deleteOpen} title={selectedFileIds.size > 0 ? 'Delete Files' : 'Delete File'} description={selectedFileIds.size > 0 ? `Delete ${selectedFileIds.size} files?` : `Delete ${activeFile?.name ?? 'file'}?`} onClose={() => setDeleteOpen(false)}>
        <Stack direction="row" justifyContent="flex-end" spacing={1}><Button onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="contained" color="error" onClick={deleteFile}>Delete</Button></Stack>
      </DummyModal>

      <DummyModal open={shareOpen} title="Share Link" description={activeFile?.name ?? ''} onClose={() => setShareOpen(false)}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary">9Drive Public Share Link (No GDrive login required)</Typography>
            <TextField fullWidth value={shareUrl} slotProps={{ input: { readOnly: true } }} size="small" sx={{ mt: 1 }} />
          </Box>
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button onClick={() => setShareOpen(false)}>Close</Button>
            <Button variant="contained" onClick={copyShareLink} startIcon={copiedShareLink ? <CheckCircleIcon /> : null}>{copiedShareLink ? 'Copied!' : 'Copy Link'}</Button>
          </Stack>
          
          {activeFile?.accountProvider === 'google_drive' && (
            <Box sx={{ pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Google Drive Direct Link (Public Access)</Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>Configure this file to be publicly accessible on Google Drive.</Typography>
              {gdrivePublicUrl ? (
                <Stack spacing={2}>
                  <TextField fullWidth value={gdrivePublicUrl} slotProps={{ input: { readOnly: true } }} size="small" />
                  <Alert severity="success">Google Drive public link generated and copied to clipboard!</Alert>
                </Stack>
              ) : (
                <Button variant="outlined" color="primary" fullWidth disabled={makingPublic} onClick={async () => {
                  if (!activeFile?.id) return; setMakingPublic(true)
                  try {
                    const res = await apiFetch<{ url: string }>('/files/' + activeFile.id + '/public-permission', { method: 'POST' })
                    setGdrivePublicUrl(res.url); await navigator.clipboard.writeText(res.url)
                  } catch (err: any) { alert('Failed to update permission: ' + (err.message || err)) }
                  finally { setMakingPublic(false) }
                }}>
                  {makingPublic ? 'Making Public...' : 'Make Public & Copy GDrive Link'}
                </Button>
              )}
            </Box>
          )}
        </Stack>
      </DummyModal>

      <DummyModal open={folderRenameOpen} title="Rename Folder" description={activeFolderForMenu?.name ?? ''} onClose={() => setFolderRenameOpen(false)}>
        <form onSubmit={renameFolder}>
          <Stack spacing={3}>
            <TextField label="Folder Name" fullWidth value={folderRenameValue} onChange={(e) => setFolderRenameValue(e.target.value)} required />
            <FolderAppearanceFields color={folderRenameColor} iconUrl={folderRenameIconUrl} onColorChange={setFolderRenameColor} onIconChange={setFolderRenameIconUrl} />
            <Stack direction="row" justifyContent="flex-end" spacing={1}><Button onClick={() => setFolderRenameOpen(false)}>Cancel</Button><Button type="submit" variant="contained">Rename</Button></Stack>
          </Stack>
        </form>
      </DummyModal>

      <DummyModal open={folderDeleteOpen} title="Delete Folder" description={`Delete virtual folder ${activeFolderForMenu?.name ?? ''}? Files inside will remain uploaded.`} onClose={() => setFolderDeleteOpen(false)}>
        <Stack direction="row" justifyContent="flex-end" spacing={1}><Button onClick={() => setFolderDeleteOpen(false)}>Cancel</Button><Button variant="contained" color="error" onClick={deleteFolder}>Delete</Button></Stack>
      </DummyModal>

      <DummyModal open={inviteOpen} title="Invite Member" description={`Share ${inviteTargetType === 'file' ? (activeFile?.name ?? 'file') : (activeFolderForMenu?.name ?? 'folder')} with a team member.`} onClose={() => setInviteOpen(false)}>
        <form onSubmit={sendInvite}>
          <Stack spacing={3}>
            <TextField label="Email Address" type="email" fullWidth value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={inviteRole} label="Role" onChange={(e) => setInviteRole(e.target.value)}>
                <MenuItem value="viewer">Can view</MenuItem>
                <MenuItem value="editor">Can edit</MenuItem>
              </Select>
            </FormControl>
            {inviteMessage && <Alert severity="info">{inviteMessage}</Alert>}
            <Stack direction="row" justifyContent="flex-end" spacing={1}><Button onClick={() => setInviteOpen(false)}>Cancel</Button><Button type="submit" variant="contained" disabled={inviting}>{inviting ? 'Sending...' : 'Send Invite'}</Button></Stack>
          </Stack>
        </form>
      </DummyModal>

      <DummyModal open={previewOpen} title="File Preview" description={activeFile?.name ?? ''} onClose={closePreview}>
        <Box sx={{ display: 'flex', height: '70vh', width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
          {previewLoading && <CircularProgress />}
          {previewError && <Typography color="error">{previewError}</Typography>}
          {!previewLoading && !previewError && activePreviewKind === 'image' && previewUrl && <img src={previewUrl} alt={activeFile?.name ?? 'File preview'} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} onError={() => setPreviewError('Failed to load preview.')} />}
          {!previewLoading && !previewError && activePreviewKind === 'video' && previewUrl && <div style={{ width: '100%', height: '100%' }}><video ref={previewVideoRef} controls playsInline preload="metadata" style={{ width: '100%', height: '100%' }} onError={() => setPreviewError('Failed to load preview.')}><source src={previewUrl} type={activeFile?.mimeType} /></video></div>}
          {!previewLoading && !previewError && activePreviewKind === 'document' && previewUrl && <iframe src={previewUrl} title={activeFile?.name ?? 'File preview'} style={{ height: '100%', width: '100%', border: 'none' }} />}
          {!previewLoading && !previewError && activePreviewKind === 'office' && previewUrl && <iframe src={officeViewerUrl(previewUrl)} title={activeFile?.name ?? 'File preview'} style={{ height: '100%', width: '100%', border: 'none' }} />}
          {!previewLoading && !previewError && !activePreviewKind && <Typography color="text.secondary">Preview not available for this file type. Use Download instead.</Typography>}
        </Box>
      </DummyModal>
    </>
  )
}
