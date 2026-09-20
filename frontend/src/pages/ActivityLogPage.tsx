import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import HistoryIcon from '@mui/icons-material/History'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import MoveUpIcon from '@mui/icons-material/TurnRight' // Substitute for move
import DownloadIcon from '@mui/icons-material/Download'
import FolderIcon from '@mui/icons-material/Folder'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import { PageHeader } from '@/components/drive/PageHeader'
import { apiFetch, formatDate } from '@/lib/api'

type AuditLog = {
  id: string
  action: string
  entityType: string
  entityId: string | null
  metadata: string | any | null
  createdAt: string
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function ActivityLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadLogs() {
    setLoading(true); setError('')
    try {
      const data = await apiFetch<{ logs: AuditLog[] }>('/audit-logs')
      setLogs(data.logs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadLogs().catch(() => undefined) }, [])

  function getActionBadge(action: string) {
    const act = action.toUpperCase()
    if (act.includes('CREATE') || act.includes('UPLOAD')) return { color: 'success' as const, icon: AddIcon, label: action.replace(/_/g, ' ') }
    if (act.includes('DELETE') || act.includes('PERMANENT') || act.includes('TRASH')) return { color: 'error' as const, icon: DeleteIcon, label: action.replace(/_/g, ' ') }
    if (act.includes('RESTORE') || act.includes('SYNC')) return { color: 'warning' as const, icon: RefreshIcon, label: action.replace(/_/g, ' ') }
    if (act.includes('MOVE')) return { color: 'secondary' as const, icon: MoveUpIcon, label: action.replace(/_/g, ' ') }
    if (act.includes('DOWNLOAD')) return { color: 'info' as const, icon: DownloadIcon, label: action.replace(/_/g, ' ') }
    return { color: 'default' as const, icon: HistoryIcon, label: action.replace(/_/g, ' ') }
  }

  function renderMetadata(metadata: any) {
    if (!metadata) return null
    let parsed = metadata
    if (typeof metadata === 'string') {
      try { parsed = JSON.parse(metadata) } catch { return <Typography variant="caption" color="text.secondary">{metadata}</Typography> }
    }
    if (typeof parsed !== 'object') return <Typography variant="caption" color="text.secondary">{String(parsed)}</Typography>

    const parts: string[] = []
    if (parsed.name) parts.push(`Name: ${parsed.name}`)
    if (parsed.fileName) parts.push(`File: ${parsed.fileName}`)
    if (parsed.folderName) parts.push(`Folder: ${parsed.folderName}`)
    if (parsed.count !== undefined) parts.push(`Count: ${parsed.count}`)
    if (parsed.sizeBytes !== undefined) parts.push(`Size: ${formatBytes(Number(parsed.sizeBytes))}`)

    if (parts.length > 0) return <Typography variant="caption" color="text.secondary" fontWeight={500}>{parts.join(' | ')}</Typography>
    return <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{JSON.stringify(parsed)}</Typography>
  }

  return (
    <Box>
      <PageHeader title="Activity Log" description="View audit trails and file activities in your 9Drive workspace." />

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      <Card variant="outlined" sx={{ mt: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <HistoryIcon fontSize="small" color="action" />
            <Typography variant="subtitle2" fontWeight={700}>Recent Activity Trail</Typography>
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">Loading activity logs...</Typography>
          </Box>
        ) : logs.length === 0 ? (
          <Box sx={{ p: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" fontWeight={700}>No activity yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Actions you perform will appear here.</Typography>
          </Box>
        ) : (
          <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
            {logs.map((log) => {
              const badge = getActionBadge(log.action)
              const EntityIcon = log.entityType === 'folder' ? FolderIcon : InsertDriveFileIcon

              return (
                <Box key={log.id} sx={{ p: 2.5, '&:hover': { bgcolor: 'action.hover' }, transition: 'background-color 0.2s' }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                      <Avatar sx={{ bgcolor: `${badge.color}.light`, color: `${badge.color}.main`, width: 36, height: 36 }}>
                        <badge.icon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5, flexWrap: 'wrap' }}>
                          <Chip label={badge.label} size="small" variant="outlined" color={badge.color} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <EntityIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{log.entityType}</Typography>
                          </Stack>
                        </Stack>
                        {renderMetadata(log.metadata)}
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5} alignSelf={{ xs: 'flex-start', sm: 'center' }}>
                      <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">{formatDate(log.createdAt)}</Typography>
                    </Stack>
                  </Stack>
                </Box>
              )
            })}
          </Stack>
        )}
      </Card>
    </Box>
  )
}
