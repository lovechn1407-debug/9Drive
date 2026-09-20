import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import DeleteIcon from '@mui/icons-material/Delete'
import RestoreIcon from '@mui/icons-material/Restore'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import { PageHeader } from '@/components/drive/PageHeader'
import { apiFetch, formatBytes } from '@/lib/api'

type TrashFile = {
  id: string
  name: string
  mimeType: string
  sizeBytes: string
  provider: string
  deletedAt: string
  connectedAccount: { email: string; provider: string }
}

export function TrashPage() {
  const [files, setFiles] = useState<TrashFile[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  async function loadTrash() {
    setLoading(true)
    try {
      const data = await apiFetch<{ files: TrashFile[] }>('/files/trash')
      setFiles(data.files)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load trash')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTrash().catch(() => undefined) }, [])

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  function toggleSelectAll() {
    if (selectedIds.size === files.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(files.map((f) => f.id)))
  }

  async function handleRestore(ids: string[]) {
    if (ids.length === 0) return
    setLoading(true); setMessage('')
    try {
      await apiFetch('/files/batch/restore', { method: 'POST', body: JSON.stringify({ fileIds: ids }) })
      setFiles((prev) => prev.filter((f) => !ids.includes(f.id)))
      setSelectedIds((prev) => { const next = new Set(prev); ids.forEach((id) => next.delete(id)); return next })
      setMessage(`Successfully restored ${ids.length} file(s).`); setMessageType('success')
      window.dispatchEvent(new Event('9drive:storage-changed'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to restore files'); setMessageType('error')
    } finally { setLoading(false) }
  }

  async function handlePermanentDelete(ids: string[]) {
    if (ids.length === 0) return
    if (!confirm(`Are you sure you want to permanently delete ${ids.length} file(s)? This action cannot be undone.`)) return
    setLoading(true); setMessage('')
    try {
      await apiFetch('/files/batch/permanent', { method: 'DELETE', body: JSON.stringify({ fileIds: ids }) })
      setFiles((prev) => prev.filter((f) => !ids.includes(f.id)))
      setSelectedIds((prev) => { const next = new Set(prev); ids.forEach((id) => next.delete(id)); return next })
      setMessage(`Permanently deleted ${ids.length} file(s).`); setMessageType('success')
      window.dispatchEvent(new Event('9drive:storage-changed'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to permanently delete files'); setMessageType('error')
    } finally { setLoading(false) }
  }

  return (
    <Box>
      <PageHeader
        title="Recycle Bin"
        description="Manage deleted files. Restore them to active folders or delete them permanently."
        actions={
          selectedIds.size > 0 && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" color="primary" onClick={() => handleRestore(Array.from(selectedIds))} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <RestoreIcon />}>
                Restore ({selectedIds.size})
              </Button>
              <Button variant="contained" color="error" onClick={() => handlePermanentDelete(Array.from(selectedIds))} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <DeleteForeverIcon />}>
                Delete ({selectedIds.size})
              </Button>
            </Stack>
          )
        }
      />

      {message && (
        <Alert severity={messageType || 'info'} sx={{ mt: 2 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mt: 3, overflow: 'hidden' }}>
        {files.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 8, textAlign: 'center' }}>
            <DeleteIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" fontWeight={700}>Trash is empty</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Deleted files will appear here.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 40 }}>
                    <Checkbox
                      size="small"
                      checked={selectedIds.size === files.length && files.length > 0}
                      indeterminate={selectedIds.size > 0 && selectedIds.size < files.length}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700}>Name</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700}>Account</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700}>Size</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700}>Deleted At</Typography></TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((file) => {
                  const isSelected = selectedIds.has(file.id)
                  return (
                    <TableRow key={file.id} hover selected={isSelected} sx={{ '&.Mui-selected': { bgcolor: 'action.selected' } }}>
                      <TableCell padding="checkbox">
                        <Checkbox size="small" checked={isSelected} onChange={() => toggleSelect(file.id)} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <InsertDriveFileIcon color="action" fontSize="small" />
                          <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 280 }} title={file.name}>{file.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{file.connectedAccount.email} ({file.provider})</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{formatBytes(file.sizeBytes)}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(file.deletedAt))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                          <Button size="small" variant="outlined" color="primary" onClick={() => handleRestore([file.id])} disabled={loading} sx={{ minWidth: 0, px: 1.5, py: 0.5, height: 28 }}>
                            Restore
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handlePermanentDelete([file.id])} disabled={loading} sx={{ minWidth: 0, px: 1, py: 0.5, height: 28 }}>
                            <DeleteForeverIcon fontSize="small" />
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>
    </Box>
  )
}
