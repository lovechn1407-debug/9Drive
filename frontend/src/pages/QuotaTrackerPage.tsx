import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Grid from '@mui/material/Grid'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import CloudIcon from '@mui/icons-material/Cloud'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import StorageIcon from '@mui/icons-material/Storage'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { PageHeader } from '@/components/drive/PageHeader'
import { apiFetch, formatBytes } from '@/lib/api'

type StorageSummary = { totalBytes: string; usedBytes: string; availableBytes: string }
type ConnectedAccount = {
  id: string; email: string; displayName?: string | null; provider: string; status: string
  storageAccount?: { totalBytes: string | null; usedBytes: string; availableBytes: string | null; lastSyncedAt: string | null } | null
}
type RoutingMode = 'most_available' | 'round_robin' | 'priority'
type RoutingPolicy = { mode: RoutingMode; priorityAccountIds: string[]; roundRobinCursor: number }

function providerLabel(provider: string) { return provider === 's3' ? 'S3 Storage' : 'Google Drive' }
function storageLimitLabel(account: ConnectedAccount) {
  if (account.provider === 's3' && account.storageAccount?.totalBytes === null) return 'Unlimited'
  return formatBytes(account.storageAccount?.totalBytes)
}
function availableLabel(account: ConnectedAccount) {
  if (account.provider === 's3' && account.storageAccount?.availableBytes === null) return 'Unlimited'
  return formatBytes(account.storageAccount?.availableBytes)
}
function pct(account: ConnectedAccount) {
  const total = Number(account.storageAccount?.totalBytes ?? 0)
  const used = Number(account.storageAccount?.usedBytes ?? 0)
  return total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
}
function progressColor(percent: number): 'error' | 'warning' | 'success' {
  if (percent >= 80) return 'error'
  if (percent >= 50) return 'warning'
  return 'success'
}

export function QuotaTrackerPage() {
  const [summary, setSummary] = useState<StorageSummary | null>(null)
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [routingPolicy, setRoutingPolicy] = useState<RoutingPolicy>({ mode: 'most_available', priorityAccountIds: [], roundRobinCursor: 0 })
  const [message, setMessage] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)

  async function load() {
    const [summaryData, accountData, policyData] = await Promise.all([
      apiFetch<StorageSummary>('/storage/summary'),
      apiFetch<{ accounts: ConnectedAccount[] }>('/connected-accounts'),
      apiFetch<{ policy: RoutingPolicy }>('/storage/routing-policy'),
    ])
    setSummary(summaryData)
    setAccounts(accountData.accounts)
    setRoutingPolicy(policyData.policy)
  }

  async function refresh() {
    setRefreshing(true)
    try { await load() } finally { setRefreshing(false) }
  }

  useEffect(() => {
    load().catch((e) => setMessage(e instanceof Error ? e.message : 'Failed to load quota tracker'))
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = window.setInterval(() => load().catch(() => undefined), 35_000)
    return () => window.clearInterval(timer)
  }, [autoRefresh])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== 'GOOGLE_CONNECTED') return
      setMessage(event.data.status === 'success' ? 'Google Drive connected.' : 'Connection failed.')
      load().catch(() => undefined)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  async function connectDrive() {
    const popup = window.open('', 'google-drive-connect', 'width=540,height=720')
    try {
      const data = await apiFetch<{ url: string }>('/connected-accounts/google/connect-url')
      if (popup) popup.location.href = data.url
      else window.location.href = data.url
    } catch (e) {
      if (popup) popup.close()
    }
  }

  async function sync(accountId: string) {
    setSyncingAccountId(accountId)
    try { await apiFetch(`/connected-accounts/${accountId}/sync-quota`, { method: 'POST' }); await load() }
    finally { setSyncingAccountId(null) }
  }

  async function saveRoutingPolicy(nextPolicy: RoutingPolicy) {
    setRoutingPolicy(nextPolicy)
    const data = await apiFetch<{ policy: RoutingPolicy }>('/storage/routing-policy', { method: 'PATCH', body: JSON.stringify({ mode: nextPolicy.mode, priorityAccountIds: nextPolicy.priorityAccountIds }) })
    setRoutingPolicy(data.policy)
    setMessage('Upload routing policy updated.')
  }

  function orderedAccounts() {
    const byId = new Map(accounts.map((a) => [a.id, a]))
    const ordered = routingPolicy.priorityAccountIds.map((id) => byId.get(id)).filter((a): a is ConnectedAccount => Boolean(a))
    const orderedIds = new Set(ordered.map((a) => a.id))
    return [...ordered, ...accounts.filter((a) => !orderedIds.has(a.id))]
  }

  function moveAccount(accountId: string, direction: -1 | 1) {
    const ids = orderedAccounts().map((a) => a.id)
    const index = ids.indexOf(accountId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ids.length) return
    const nextIds = [...ids]
    const [item] = nextIds.splice(index, 1)
    nextIds.splice(target, 0, item)
    saveRoutingPolicy({ ...routingPolicy, priorityAccountIds: nextIds }).catch((e) => setMessage(e instanceof Error ? e.message : 'Failed to update routing'))
  }

  return (
    <>
      <PageHeader
        title="Quota Tracker"
        description="Track and manage connected provider storage limits."
        actions={
          <Stack spacing={1} sx={{ width: '100%' }}>
            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
              <Button variant="outlined" size="small" startIcon={<CheckCircleIcon />} onClick={() => setAutoRefresh(!autoRefresh)} color={autoRefresh ? 'success' : 'inherit'} sx={{ flex: 1 }}>
                Auto-refresh {autoRefresh ? 'On' : 'Off'}
              </Button>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={refresh} disabled={refreshing} sx={{ flex: 1 }}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Stack>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={connectDrive}
            >
              Add more drives
            </Button>
          </Stack>
        }
      />

      {message && <Alert severity="info" sx={{ mt: 2 }} onClose={() => setMessage('')}>{message}</Alert>}

      {/* Summary metrics */}
      <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
        {[
          { label: 'Total Storage', value: formatBytes(summary?.totalBytes) },
          { label: 'Used Storage', value: formatBytes(summary?.usedBytes) },
          { label: 'Available', value: formatBytes(summary?.availableBytes) },
          { label: 'Accounts', value: String(accounts.length) },
        ].map((metric) => (
          <Card key={metric.label} variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>{metric.label}</Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>{metric.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Routing policy */}
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Upload Routing</Typography>
              <Typography variant="body2" color="text.secondary">Choose how new uploads pick connected storage accounts.</Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Routing Mode</InputLabel>
              <Select
                value={routingPolicy.mode}
                label="Routing Mode"
                onChange={(e) => saveRoutingPolicy({ ...routingPolicy, mode: e.target.value as RoutingMode }).catch((err) => setMessage(err instanceof Error ? err.message : 'Failed'))}
              >
                <MenuItem value="most_available">Most available</MenuItem>
                <MenuItem value="round_robin">Round robin</MenuItem>
                <MenuItem value="priority">Priority order</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack spacing={1.5}>
            {orderedAccounts().map((account, index) => (
              <Paper key={account.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', borderRadius: 2 }}>
                      {account.provider === 's3' ? <StorageIcon /> : <CloudIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{account.displayName || account.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {providerLabel(account.provider)} · {formatBytes(account.storageAccount?.usedBytes)} used · {availableLabel(account)} free
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => moveAccount(account.id, -1)} disabled={index === 0}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => moveAccount(account.id, 1)} disabled={index === accounts.length - 1}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
                  </Stack>
                </Stack>
              </Paper>
            ))}
            {accounts.length === 0 && <Typography variant="body2" color="text.secondary">Connect storage accounts to configure routing.</Typography>}
          </Stack>
        </CardContent>
      </Card>

      {/* Account cards */}
      <Box sx={{ mt: 5, mb: 1.5 }}>
        <Typography variant="h6" fontWeight={700}>Available Accounts</Typography>
        <Typography variant="body2" color="text.secondary">All connected storage accounts and their current quota.</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        {accounts.length === 0 ? (
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Card variant="outlined" sx={{ textAlign: 'center', py: 6 }}>
              <CloudIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={700}>No connected drives</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Connect Google Drive or S3-compatible storage to start tracking quota.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={connectDrive}>Connect Drive</Button>
            </Card>
          </Box>
        ) : accounts.map((account) => {
          const percent = pct(account)
          const color = progressColor(percent)
          return (
            <Box key={account.id}>
              <Card variant="outlined" sx={{ overflow: 'hidden' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, borderRadius: 2 }}>
                        {account.provider === 's3' ? <StorageIcon /> : <CloudIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{providerLabel(account.provider)}</Typography>
                        <Typography variant="caption" color="text.secondary">{account.email}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip label={account.status} size="small" color={account.status === 'connected' ? 'success' : 'default'} />
                      <IconButton size="small" onClick={() => sync(account.id)} disabled={syncingAccountId === account.id}>
                        <RefreshIcon fontSize="small" sx={syncingAccountId === account.id ? { animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } } : {}} />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight={600}>Storage used</Typography>
                    <Typography variant="caption" fontWeight={700}>{percent}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={percent} color={color} sx={{ mb: 1.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      {formatBytes(account.storageAccount?.usedBytes)} / {storageLimitLabel(account)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Available: {availableLabel(account)}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          )
        })}
      </Box>
    </>
  )
}
