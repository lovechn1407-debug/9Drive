import { useEffect, useState, useRef, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'
import CloudIcon from '@mui/icons-material/Cloud'
import StorageIcon from '@mui/icons-material/Storage'
import RefreshIcon from '@mui/icons-material/Refresh'
import LinkIcon from '@mui/icons-material/Link'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'
import NotificationsIcon from '@mui/icons-material/Notifications'
import LanguageIcon from '@mui/icons-material/Language'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import HelpIcon from '@mui/icons-material/Help'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import BuildIcon from '@mui/icons-material/Build'
import { PageHeader } from '@/components/drive/PageHeader'
import { DummyModal } from '@/components/drive/DummyModal'
import { apiFetch, formatBytes, API_URL } from '@/lib/api'
import { getGravatarUrl } from '@/lib/gravatar'
import { getStoredUser, getAccessToken, clearAuthSession } from '@/lib/auth'

type ConnectedAccount = {
  id: string; provider: string; email: string; displayName?: string | null; status: string
  storageAccount?: { totalBytes: string | null; usedBytes: string; availableBytes: string | null; lastSyncedAt: string | null } | null
}

function providerLabel(provider: string) { return provider === 's3' ? 'S3 Storage' : 'Google Drive' }
function storageLimitLabel(account: ConnectedAccount) {
  if (account.provider === 's3' && account.storageAccount?.totalBytes === null) return 'Unlimited'
  return formatBytes(account.storageAccount?.totalBytes)
}
function availableLabel(account: ConnectedAccount) {
  if (account.provider === 's3' && account.storageAccount?.availableBytes === null) return 'Unlimited'
  return formatBytes(account.storageAccount?.availableBytes)
}

export function SettingsPage() {
  const user = getStoredUser()
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [message, setMessage] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [s3Open, setS3Open] = useState(false)
  const [connectingS3, setConnectingS3] = useState(false)
  const [s3Form, setS3Form] = useState({ name: '', bucket: '', region: 'us-east-1', endpoint: '', accessKeyId: '', secretAccessKey: '', forcePathStyle: false, quotaBytes: '' })
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)
  const [disconnectingAccountId, setDisconnectingAccountId] = useState<string | null>(null)
  const [accountToDisconnect, setAccountToDisconnect] = useState<ConnectedAccount | null>(null)
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [avatarError, setAvatarError] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [updatingSystem, setUpdatingSystem] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateModalTitle, setUpdateModalTitle] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [googleRedirectUri, setGoogleRedirectUri] = useState('')
  const [defaultRedirectUri, setDefaultRedirectUri] = useState('')
  const [hasSecret, setHasSecret] = useState(false)
  const [savingGoogleConfig, setSavingGoogleConfig] = useState(false)
  const [showGoogleHelp, setShowGoogleHelp] = useState(false)
  const [isPollingLog, setIsPollingLog] = useState(false)
  const [updateLog, setUpdateLog] = useState('')
  const [updateFinished, setUpdateFinished] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null)
  const [reconnectCount, setReconnectCount] = useState(0)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [downloadingBackup, setDownloadingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restoreMessage, setRestoreMessage] = useState('')
  const [restoreSuccess, setRestoreSuccess] = useState(false)

  async function downloadBackup() {
    setDownloadingBackup(true)
    try {
      const token = getAccessToken()
      const response = await fetch(`${API_URL}/system/backup`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error('Failed to retrieve database backup.')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = '9drive-backup.db'
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url)
    } catch (err: any) { alert('Failed to download backup: ' + err.message) }
    finally { setDownloadingBackup(false) }
  }

  function handleRestoreFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) setRestoreFile(e.target.files[0])
    else setRestoreFile(null)
  }

  async function restoreBackup() {
    if (!restoreFile) return
    if (!confirm('WARNING: Restoring database will overwrite all your current configurations, connected accounts, virtual folders, and user accounts. The server will restart. Are you sure?')) return
    setRestoringBackup(true); setRestoreMessage(''); setRestoreSuccess(false)
    try {
      const token = getAccessToken()
      const formData = new FormData(); formData.append('file', restoreFile)
      const response = await fetch(`${API_URL}/system/restore`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to restore database.')
      setRestoreSuccess(true)
      setRestoreMessage(data.message || 'Database restored successfully! Logging you out and reloading...')
      setTimeout(() => { clearAuthSession(); window.location.href = '/login' }, 4000)
    } catch (err: any) { setRestoreSuccess(false); setRestoreMessage(err.message || 'Failed to restore database.') }
    finally { setRestoringBackup(false) }
  }

  useEffect(() => {
    if (!isPollingLog) return
    let intervalId: any; let active = true
    async function fetchLog() {
      try {
        const data = await apiFetch<{ log: string }>('/system/update-log')
        if (!active) return
        setUpdateLog(data.log); setReconnectCount(0)
        if (data.log.includes('=== System Update Completed:')) {
          setUpdateFinished(true); setUpdateSuccess(true); setIsPollingLog(false); setUpdateModalTitle('System Updated')
        }
      } catch (err) { if (!active) return; setReconnectCount((prev) => prev + 1) }
    }
    fetchLog(); intervalId = setInterval(fetchLog, 2000)
    return () => { active = false; clearInterval(intervalId) }
  }, [isPollingLog])

  useEffect(() => {
    if (logContainerRef.current) logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
  }, [updateLog])

  async function runSystemUpdate() {
    setUpdatingSystem(true); setMessage(''); setUpdateLog('Initiating system update in the background...\n')
    setUpdateFinished(false); setUpdateSuccess(null); setReconnectCount(0)
    setUpdateModalTitle('System Updating'); setUpdateModalOpen(true)
    try {
      await apiFetch<{ message: string }>('/system/update', { method: 'POST' }); setIsPollingLog(true)
    } catch (error) {
      setUpdateModalTitle('System Update Failed')
      const errMsg = error instanceof Error ? error.message : 'System update failed to initiate.'
      setUpdateLog((prev) => prev + `\nError: ${errMsg}`); setUpdateFinished(true); setUpdateSuccess(false)
    } finally { setUpdatingSystem(false) }
  }

  async function saveGoogleConfig(event: FormEvent) {
    event.preventDefault(); setSavingGoogleConfig(true); setMessage('')
    try {
      const res = await apiFetch<{ message: string }>('/system/google-config', {
        method: 'POST',
        body: JSON.stringify({ clientId: googleClientId, clientSecret: googleClientSecret || undefined, redirectUri: googleRedirectUri || defaultRedirectUri }),
      })
      setMessage(res.message || 'Google OAuth credentials saved.'); setHasSecret(true); setGoogleClientSecret('')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Failed to save Google OAuth configuration') }
    finally { setSavingGoogleConfig(false) }
  }

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? accounts[0] ?? null

  async function load() {
    const data = await apiFetch<{ accounts: ConnectedAccount[] }>('/connected-accounts')
    setAccounts(data.accounts)
    try {
      const configData = await apiFetch<{ exists: boolean; clientId: string; redirectUri: string; hasSecret: boolean; defaultRedirectUri: string }>('/system/google-config')
      if (configData.exists) { setGoogleClientId(configData.clientId || ''); setGoogleRedirectUri(configData.redirectUri || ''); setHasSecret(configData.hasSecret || false) }
      setDefaultRedirectUri(configData.defaultRedirectUri || '')
    } catch (e) { console.error('Failed to load global Google config', e) }
  }

  useEffect(() => { load().catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load settings')) }, [])
  useEffect(() => { setAvatarError(false); getGravatarUrl(user?.email, 96).then(setProfileImageUrl).catch(() => setProfileImageUrl('')) }, [user?.email])
  useEffect(() => {
    if (accounts.length === 0) { setSelectedAccountId(''); return }
    if (!accounts.some((a) => a.id === selectedAccountId)) setSelectedAccountId(accounts[0].id)
  }, [accounts, selectedAccountId])
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== 'GOOGLE_CONNECTED') return
      setMessage(event.data.status === 'success' ? 'Google Drive connected.' : 'Google Drive connection failed.')
      load().then(() => window.dispatchEvent(new Event('9drive:storage-changed'))).catch(() => undefined)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  async function connectDrive() {
    setConnecting(true); setMessage('')
    const popup = window.open('', 'google-drive-connect', 'width=540,height=720')
    if (popup) popup.document.write('<html><head><title>Connecting...</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;"><h2>Connecting to Google...</h2></div></body></html>')
    try {
      const data = await apiFetch<{ url: string }>('/connected-accounts/google/connect-url')
      if (popup) popup.location.href = data.url
      else window.location.href = data.url
    } catch (error) { if (popup) popup.close(); setMessage(error instanceof Error ? error.message : 'Failed to start Google Drive connection') }
    finally { setConnecting(false) }
  }

  async function sync(accountId: string) {
    setSyncingAccountId(accountId)
    try { await apiFetch(`/connected-accounts/${accountId}/sync-quota`, { method: 'POST' }); await load(); window.dispatchEvent(new Event('9drive:storage-changed')) }
    finally { setSyncingAccountId(null) }
  }

  async function disconnect() {
    if (!accountToDisconnect) return
    setDisconnectingAccountId(accountToDisconnect.id); setMessage('')
    try {
      await apiFetch(`/connected-accounts/${accountToDisconnect.id}`, { method: 'DELETE' })
      setAccountToDisconnect(null); setMessage('Storage account disconnected.')
      await load(); window.dispatchEvent(new Event('9drive:storage-changed'))
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Failed to disconnect') }
    finally { setDisconnectingAccountId(null) }
  }

  async function connectS3(event: FormEvent) {
    event.preventDefault(); setConnectingS3(true); setMessage('')
    try {
      await apiFetch('/connected-accounts/s3', { method: 'POST', body: JSON.stringify({ ...s3Form, endpoint: s3Form.endpoint || undefined, quotaBytes: s3Form.quotaBytes || null }) })
      setS3Open(false)
      setS3Form({ name: '', bucket: '', region: 'us-east-1', endpoint: '', accessKeyId: '', secretAccessKey: '', forcePathStyle: false, quotaBytes: '' })
      setMessage('S3 storage connected.')
      await load(); window.dispatchEvent(new Event('9drive:storage-changed'))
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Failed to connect S3 storage') }
    finally { setConnectingS3(false) }
  }

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Settings"
        description="Manage your account, Google OAuth keys, and database backup & restore."
      />

      {message && <Alert severity="info" sx={{ mt: 2 }} onClose={() => setMessage('')}>{message}</Alert>}

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Main column */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            {/* User Profile */}
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  {!profileImageUrl || avatarError ? (
                    <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 700, fontSize: '1.5rem' }}>
                      {(user?.name ?? user?.email ?? 'U').trim().charAt(0).toUpperCase()}
                    </Avatar>
                  ) : (
                    <Avatar src={profileImageUrl} sx={{ width: 56, height: 56 }} onError={() => setAvatarError(true)} />
                  )}
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{user?.name ?? 'User'}</Typography>
                    <Typography variant="body2" color="text.secondary">{user?.email ?? '—'}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Google Drive Integration */}
            <Card variant="outlined">
              <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <CloudIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={700}>Google Drive Integration</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Connect Google Drive accounts. Uploads will stream directly to dedicated <code>9drive</code> folder.
                  </Typography>
                </Box>
                <Button variant="contained" size="small" onClick={connectDrive} disabled={connecting} startIcon={<LinkIcon />} sx={{ flexShrink: 0 }}>
                  {connecting ? 'Opening...' : 'Connect Drive'}
                </Button>
              </CardContent>
            </Card>

            {/* S3 Storage */}
            <Card variant="outlined">
              <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <StorageIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={700}>S3 Compatible Storage</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">Connect AWS S3, Cloudflare R2, MinIO, Wasabi, or custom endpoint S3 storage.</Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={() => setS3Open(true)} startIcon={<StorageIcon />} sx={{ flexShrink: 0 }}>Connect S3</Button>
              </CardContent>
            </Card>

            {/* Connected Accounts */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Connected Storage Accounts</Typography>
                {accounts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No connected storage accounts yet. Click Connect Drive or Connect S3 above.</Typography>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Choose Account</InputLabel>
                      <Select value={selectedAccount?.id ?? ''} label="Choose Account" onChange={(e) => setSelectedAccountId(e.target.value)}>
                        {accounts.map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            {providerLabel(account.provider)} — {account.displayName || account.email} ({account.status})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {selectedAccount && (
                      <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 3 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
                          <Box>
                            <Typography variant="body1" fontWeight={700}>{selectedAccount.displayName || selectedAccount.email}</Typography>
                            <Typography variant="caption" color="text.secondary">{providerLabel(selectedAccount.provider)} · Status: {selectedAccount.status}</Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="outlined" onClick={() => sync(selectedAccount.id)} disabled={syncingAccountId === selectedAccount.id}
                              startIcon={syncingAccountId === selectedAccount.id ? <CircularProgress size={16} /> : <RefreshIcon />}>Sync</Button>
                            <Button size="small" variant="outlined" color="error" onClick={() => setAccountToDisconnect(selectedAccount)} startIcon={<DeleteIcon />}>Disconnect</Button>
                          </Stack>
                        </Stack>
                        <Divider sx={{ my: 1.5 }} />
                        <Grid container spacing={2} sx={{ textAlign: 'center' }}>
                          {[
                            { label: 'Used', value: formatBytes(selectedAccount.storageAccount?.usedBytes) },
                            { label: 'Total', value: storageLimitLabel(selectedAccount) },
                            { label: 'Free', value: availableLabel(selectedAccount) },
                          ].map((item) => (
                            <Grid key={item.label} size={{ xs: 4 }}>
                              <Typography variant="body2" fontWeight={700}>{item.value}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Google OAuth Credentials */}
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <VpnKeyIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={700}>Google OAuth Credentials</Typography>
                  </Stack>
                  <Button size="small" variant="text" onClick={() => setShowGoogleHelp(!showGoogleHelp)} startIcon={<HelpIcon />}>
                    {showGoogleHelp ? 'Hide Guide' : 'Setup Guide'}
                  </Button>
                </Stack>

                <Collapse in={showGoogleHelp}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Google OAuth Setup Steps:</Typography>
                    <Box component="ol" sx={{ pl: 2.5, m: 0, fontSize: '0.85rem' }}>
                      <li>Go to Google Cloud Console.</li>
                      <li>Enable Google Drive API.</li>
                      <li>Create OAuth Client ID (Web Application).</li>
                      <li>Authorized redirect URI: <code>{googleRedirectUri || defaultRedirectUri}</code></li>
                      <li>Copy Client ID and Client Secret below and save.</li>
                    </Box>
                  </Alert>
                </Collapse>

                <Box component="form" onSubmit={saveGoogleConfig} sx={{ display: 'grid', gap: 2 }}>
                  <TextField label="Client ID" value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} required />
                  <TextField label={`Client Secret ${hasSecret ? '(Configured)' : ''}`} type="password" placeholder={hasSecret ? '••••••••••••••••••••••••' : 'Enter Client Secret'} value={googleClientSecret} onChange={(e) => setGoogleClientSecret(e.target.value)} required={!hasSecret} />
                  <TextField label="Redirect URI (Optional)" placeholder={defaultRedirectUri} value={googleRedirectUri} onChange={(e) => setGoogleRedirectUri(e.target.value)} />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" variant="contained" disabled={savingGoogleConfig}>
                      {savingGoogleConfig ? 'Saving...' : 'Save Credentials'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* System Update */}
            <Card variant="outlined">
              <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <RefreshIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={700}>System Update</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">Pull latest code updates from Git repository. Dev server will restart.</Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={runSystemUpdate} disabled={updatingSystem} startIcon={updatingSystem ? <CircularProgress size={16} /> : <RefreshIcon />} sx={{ flexShrink: 0 }}>
                  {updatingSystem ? 'Updating...' : 'Update Code'}
                </Button>
              </CardContent>
            </Card>

            {/* Backup & Restore */}
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <StorageIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={700}>Backup & Restore Database</Typography>
                  </Stack>
                  <Chip label="SQLite Local Database" size="small" variant="outlined" />
                </Stack>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  {/* Download */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'action.hover' }}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }}><DownloadIcon /></Avatar>
                        <Typography variant="subtitle2" fontWeight={700}>Download Backup</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                        Save a copy of your active database containing accounts, virtual folders, file metadata, and configurations.
                      </Typography>
                      <Button variant="contained" fullWidth sx={{ mt: 3 }} onClick={downloadBackup} disabled={downloadingBackup}
                        startIcon={downloadingBackup ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}>
                        {downloadingBackup ? 'Downloading...' : 'Download Backup'}
                      </Button>
                    </Paper>
                  </Grid>

                  {/* Restore */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'action.hover' }}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                        <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', width: 40, height: 40 }}><UploadIcon /></Avatar>
                        <Typography variant="subtitle2" fontWeight={700}>Restore Backup</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Upload a previously downloaded 9Drive backup file (.db) to restore database state.
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Button variant="outlined" component="label" fullWidth size="small" sx={{ mb: 1.5 }}>
                          {restoreFile ? restoreFile.name : 'Choose .db Backup File'}
                          <input type="file" accept=".db" hidden onChange={handleRestoreFileChange} />
                        </Button>
                        <Button variant="contained" color="secondary" fullWidth onClick={restoreBackup} disabled={!restoreFile || restoringBackup}
                          startIcon={restoringBackup ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}>
                          {restoringBackup ? 'Restoring...' : 'Restore Backup'}
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {restoreMessage && (
                  <Alert severity={restoreSuccess ? 'success' : 'error'} sx={{ mt: 3 }}>{restoreMessage}</Alert>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Sidebar info */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StorageIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Storage Overview</Typography>
                  <Typography variant="caption" color="text.secondary">Connected accounts: {accounts.length}</Typography>
                </Box>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <NotificationsIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
                  <Typography variant="caption" color="text.secondary">Email and quota alerts active.</Typography>
                </Box>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LanguageIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>System Region</Typography>
                  <Typography variant="caption" color="text.secondary">Local / Cloud Hybrid Gateway</Typography>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* S3 Connect Modal */}
      <DummyModal open={s3Open} title="Connect S3 Storage" description="Use S3-compatible provider with custom endpoint support." onClose={() => setS3Open(false)}>
        <Box component="form" onSubmit={connectS3} sx={{ display: 'grid', gap: 2 }}>
          <TextField label="Display name" value={s3Form.name} onChange={(e) => setS3Form({ ...s3Form, name: e.target.value })} required />
          <TextField label="Bucket" value={s3Form.bucket} onChange={(e) => setS3Form({ ...s3Form, bucket: e.target.value })} required />
          <TextField label="Region" value={s3Form.region} onChange={(e) => setS3Form({ ...s3Form, region: e.target.value })} required />
          <TextField label="Endpoint URL (Optional)" value={s3Form.endpoint} onChange={(e) => setS3Form({ ...s3Form, endpoint: e.target.value })} />
          <TextField label="Access Key ID" value={s3Form.accessKeyId} onChange={(e) => setS3Form({ ...s3Form, accessKeyId: e.target.value })} required />
          <TextField label="Secret Access Key" type="password" value={s3Form.secretAccessKey} onChange={(e) => setS3Form({ ...s3Form, secretAccessKey: e.target.value })} required />
          <TextField label="Quota bytes (Optional)" value={s3Form.quotaBytes} onChange={(e) => setS3Form({ ...s3Form, quotaBytes: e.target.value })} />
          <FormControlLabel control={<Switch checked={s3Form.forcePathStyle} onChange={(e) => setS3Form({ ...s3Form, forcePathStyle: e.target.checked })} />} label="Force path style" />
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button variant="outlined" onClick={() => setS3Open(false)} disabled={connectingS3}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={connectingS3}>{connectingS3 ? 'Connecting...' : 'Connect S3'}</Button>
          </Stack>
        </Box>
      </DummyModal>

      {/* Disconnect Modal */}
      <DummyModal open={Boolean(accountToDisconnect)} title="Disconnect storage?" description="This will remove this storage account from 9Drive." onClose={() => setAccountToDisconnect(null)}>
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="body1" fontWeight={700}>{accountToDisconnect?.email}</Typography>
            <Typography variant="body2" color="text.secondary">Used storage: {formatBytes(accountToDisconnect?.storageAccount?.usedBytes)}</Typography>
          </Paper>
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button variant="outlined" onClick={() => setAccountToDisconnect(null)} disabled={Boolean(disconnectingAccountId)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={disconnect} disabled={Boolean(disconnectingAccountId)}>
              {disconnectingAccountId ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </Stack>
        </Stack>
      </DummyModal>

      {/* System Update Modal */}
      <DummyModal
        open={updateModalOpen}
        title={updateModalTitle}
        description={updateFinished ? (updateSuccess ? 'System updated successfully' : 'Update failed') : 'Live installation logs'}
        onClose={() => {
          if (!updateFinished && !confirm('The update is still running in the background. Close log viewer?')) return
          setUpdateModalOpen(false); setIsPollingLog(false)
          if (updateFinished && updateSuccess) window.location.reload()
        }}
      >
        <Stack spacing={2}>
          <Paper
            ref={logContainerRef}
            variant="outlined"
            sx={{ p: 2, bgcolor: '#121212', color: '#00ff88', fontFamily: 'monospace', fontSize: '0.8rem', height: 320, overflowY: 'auto', borderRadius: 3 }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{updateLog}</pre>
            {!updateFinished && (
              <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                {reconnectCount > 0 ? `Reconnecting... attempt ${reconnectCount}` : 'Installing update...'}
              </Typography>
            )}
          </Paper>
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button variant="outlined" onClick={() => {
              if (!updateFinished && !confirm('The update is still running. Close log viewer?')) return
              setUpdateModalOpen(false); setIsPollingLog(false)
              if (updateFinished && updateSuccess) window.location.reload()
            }}>Close</Button>
            {updateFinished && updateSuccess && (
              <Button variant="contained" onClick={() => window.location.reload()}>Reload Page</Button>
            )}
          </Stack>
        </Stack>
      </DummyModal>
    </Box>
  )
}
