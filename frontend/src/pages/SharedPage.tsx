import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import FolderIcon from '@mui/icons-material/Folder'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import GroupIcon from '@mui/icons-material/Group'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import { MetricCard } from '@/components/drive/MetricCard'
import { PageHeader } from '@/components/drive/PageHeader'
import { apiFetch, formatBytes, formatDate } from '@/lib/api'
import { Users, UserCheck, Clock } from 'lucide-react'

type InviteTarget = { id: string; name: string; type: 'file' | 'folder'; mimeType?: string; sizeBytes?: string }
type Invite = {
  id: string; email: string; role: string; status: string; targetType: 'file' | 'folder'; targetId: string
  target: InviteTarget | null; createdAt: string; acceptedAt: string | null
  user: { id: string; name: string; email: string } | null
}

export function SharedPage() {
  const [sentInvites, setSentInvites] = useState<Invite[]>([])
  const [receivedInvites, setReceivedInvites] = useState<Invite[]>([])
  const [message, setMessage] = useState('')
  const pendingCount = sentInvites.filter((i) => i.status === 'pending').length
  const acceptedCount = sentInvites.filter((i) => i.status === 'accepted').length

  async function loadInvites() {
    const data = await apiFetch<{ sent: Invite[]; received: Invite[] }>('/invites')
    setSentInvites(data.sent)
    setReceivedInvites(data.received)
  }

  useEffect(() => {
    loadInvites().catch((e) => setMessage(e instanceof Error ? e.message : 'Failed to load shared resources'))
    window.addEventListener('9drive:invites-changed', loadInvites)
    return () => window.removeEventListener('9drive:invites-changed', loadInvites)
  }, [])

  async function revokeInvite(id: string) {
    await apiFetch(`/invites/${id}`, { method: 'DELETE' })
    await loadInvites()
  }

  return (
    <>
      <PageHeader title="Shared" description="Files and folders shared with members or shared with you." />

      {message && (
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 3, bgcolor: 'primary.light', color: 'primary.dark' }}>
          <Typography variant="body2" fontWeight={600}>{message}</Typography>
        </Box>
      )}

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard label="Shared Resources" value={String(sentInvites.length + receivedInvites.length)} icon={Users} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard label="Accepted Members" value={String(acceptedCount)} icon={UserCheck} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard label="Pending Invites" value={String(pendingCount)} icon={Clock} />
        </Grid>
      </Grid>

      {/* Shared with you */}
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Shared With You</Typography>
          {receivedInvites.length === 0 ? (
            <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'action.hover', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No files or folders have been shared with you yet.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {receivedInvites.map((invite, i) => (
                <Box key={invite.id}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {invite.targetType === 'folder'
                        ? <FolderIcon color="primary" />
                        : <InsertDriveFileIcon color="action" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600}>{invite.target?.name ?? 'Unavailable resource'}</Typography>}
                      secondary={
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                          {invite.targetType} · {invite.role}{invite.target?.sizeBytes ? ` · ${formatBytes(invite.target.sizeBytes)}` : ''}
                        </Typography>
                      }
                    />
                    <Chip
                      label={invite.status}
                      size="small"
                      color={invite.status === 'accepted' ? 'success' : 'warning'}
                      sx={{ textTransform: 'capitalize', fontWeight: 700, ml: 1 }}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Resources you shared */}
      <Card variant="outlined" sx={{ mt: 2, mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Resources You Shared</Typography>
          {sentInvites.length === 0 ? (
            <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'action.hover', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No files or folders shared yet. Use Invite Members from context menu.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {sentInvites.map((invite, i) => (
                <Box key={invite.id}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem
                    disableGutters
                    sx={{ py: 1 }}
                    secondaryAction={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip label={invite.role} size="small" color="primary" variant="outlined" sx={{ textTransform: 'capitalize', fontWeight: 700 }} />
                        <Chip
                          label={invite.status}
                          size="small"
                          color={invite.status === 'accepted' ? 'success' : 'warning'}
                          sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                        />
                        <IconButton size="small" color="error" onClick={() => revokeInvite(invite.id)} aria-label="Revoke invite">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {invite.targetType === 'folder' ? <FolderIcon color="primary" /> : <InsertDriveFileIcon color="action" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>{invite.target?.name ?? 'Unavailable resource'}</Typography>}
                      secondary={
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Shared with {invite.email}</Typography>
                          <Typography variant="caption" color="text.secondary">Invited {formatDate(invite.createdAt)}</Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </>
  )
}
