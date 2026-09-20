import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { Outlet, useOutletContext, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Popover from '@mui/material/Popover'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Alert from '@mui/material/Alert'
import Collapse from '@mui/material/Collapse'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import TuneIcon from '@mui/icons-material/Tune'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import NotificationsIcon from '@mui/icons-material/Notifications'
import FolderIcon from '@mui/icons-material/Folder'
import PieChartIcon from '@mui/icons-material/PieChart'
import ShareIcon from '@mui/icons-material/Share'
import DeleteIcon from '@mui/icons-material/Delete'
import HistoryIcon from '@mui/icons-material/History'
import SettingsIcon from '@mui/icons-material/Settings'
import CodeIcon from '@mui/icons-material/Code'
import LogoutIcon from '@mui/icons-material/Logout'
import StarIcon from '@mui/icons-material/Star'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import UploadIcon from '@mui/icons-material/Upload'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CloseIcon from '@mui/icons-material/Close'
import ShieldIcon from '@mui/icons-material/Shield'
import StorageIcon from '@mui/icons-material/Storage'
import InfoIcon from '@mui/icons-material/Info'
import { NavLink } from 'react-router-dom'
import { BrandLogo } from '@/components/drive/BrandLogo'
import { apiFetch, formatBytes } from '@/lib/api'
import { useUpload } from '@/context/UploadContext'
import { clearAuthSession, getStoredUser, updateStoredUser, type AuthUser } from '@/lib/auth'
import { getGravatarUrl } from '@/lib/gravatar'
import { useMuiTheme } from '@/context/MuiThemeProvider'

const SIDEBAR_WIDTH = 280

const navItems = [
  { label: 'All Files', icon: <FolderIcon />, href: '/all-files' },
  { label: 'Quota Tracker', icon: <PieChartIcon />, href: '/quota' },
  { label: 'Shared With Me', icon: <ShareIcon />, href: '/shared' },
  { label: 'Starred', icon: <StarIcon />, href: '/starred', disabled: true },
  { label: 'Recycle Bin', icon: <DeleteIcon />, href: '/trash' },
  { label: 'Activity Log', icon: <HistoryIcon />, href: '/activity' },
  { label: 'Settings', icon: <SettingsIcon />, href: '/settings' },
  { label: 'API Keys', icon: <CodeIcon />, href: '/api' },
]

const mobileNavItems = [
  { label: 'Files', icon: <FolderIcon />, href: '/all-files', value: '/all-files' },
  { label: 'Quota', icon: <PieChartIcon />, href: '/quota', value: '/quota' },
  { label: 'Shared', icon: <ShareIcon />, href: '/shared', value: '/shared' },
  { label: 'Settings', icon: <SettingsIcon />, href: '/settings', value: '/settings' },
]

type StorageSummary = { totalBytes: string; usedBytes: string; availableBytes: string }
type StorageBreakdown = { photo: string; video: string; document: string }
type ConnectedAccount = { id: string; email: string; provider: string }

export type DriveLayoutContext = {
  setHeaderActions: (actions: ReactNode) => void
}

export function useDriveLayoutActions() {
  return useOutletContext<DriveLayoutContext>()
}

function SidebarContent({
  user,
  storage,
  breakdown,
  onLogout,
  onNavigate,
}: {
  user: AuthUser | null
  storage: StorageSummary | null
  breakdown: StorageBreakdown
  onLogout: () => void
  onNavigate?: () => void
}) {
  const location = useLocation()
  const { mode, toggleTheme } = useMuiTheme()
  const theme = useTheme()
  const [profileUrl, setProfileUrl] = useState('')
  const [avatarError, setAvatarError] = useState(false)

  const used = Number(storage?.usedBytes ?? 0)
  const total = Number(storage?.totalBytes ?? 0)
  const progress = total > 0 ? Math.min(100, (used / total) * 100) : 0

  useEffect(() => {
    setAvatarError(false)
    getGravatarUrl(user?.email, 64).then(setProfileUrl).catch(() => setProfileUrl(''))
  }, [user?.email])

  const storageItems = [
    { label: 'Photo', value: formatBytes(breakdown.photo), color: '#84cc16' },
    { label: 'Video', value: formatBytes(breakdown.video), color: '#fbbf24' },
    { label: 'Document', value: formatBytes(breakdown.document), color: '#22d3ee' },
    { label: 'Free', value: formatBytes(storage?.availableBytes), color: '#f97316' },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, bgcolor: 'background.paper' }}>
      {/* Logo */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1, py: 1.5, mb: 1 }}>
        <BrandLogo className="h-8 w-8" />
        <Typography variant="h6" fontWeight={900} letterSpacing="-0.5px">9Drive</Typography>
      </Stack>

      {/* User card */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {!profileUrl || avatarError ? (
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700 }}>
              {(user?.name ?? user?.email ?? 'U').trim().charAt(0).toUpperCase()}
            </Avatar>
          ) : (
            <Avatar src={profileUrl} sx={{ width: 40, height: 40 }} onError={() => setAvatarError(true)} />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{user?.name ?? 'User'}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{user?.email}</Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Navigation */}
      <List dense disablePadding sx={{ flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <ListItemButton
              key={item.href}
              component={NavLink}
              to={item.href}
              disabled={item.disabled}
              onClick={onNavigate}
              selected={isActive}
              sx={{
                borderRadius: 9999,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: mode === 'dark' ? 'primary.light' : 'primary.dark',
                  '& .MuiListItemIcon-root': { color: mode === 'dark' ? 'primary.light' : 'primary.dark' },
                  '&:hover': { bgcolor: 'primary.light', opacity: 0.85 },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'inherit' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { variant: 'body2', fontWeight: isActive ? 700 : 500 } }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <Divider sx={{ my: 1.5 }} />

      {/* Storage stats */}
      <Box sx={{ px: 1 }}>
        {storageItems.map((item) => (
          <Stack key={item.label} direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
              <Typography variant="caption" color="text.secondary">{item.label}</Typography>
            </Stack>
            <Typography variant="caption" fontWeight={700}>{item.value}</Typography>
          </Stack>
        ))}

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, mb: 0.5 }}>
          <Typography variant="caption" fontWeight={700}>{formatBytes(storage?.usedBytes)} used</Typography>
          <Typography variant="caption" color="text.secondary">{formatBytes(storage?.totalBytes)}</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ mb: 1.5 }} />

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            fullWidth
            onClick={onLogout}
            sx={{ borderRadius: 9999 }}
          >
            Log Out
          </Button>
          <IconButton size="small" onClick={toggleTheme} sx={{ border: 1, borderColor: 'divider' }}>
            {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Stack>
      </Box>
    </Box>
  )
}

export function DriveLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { mode, toggleTheme } = useMuiTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '')
  const [user, setUser] = useState<AuthUser | null>(getStoredUser())
  const [storage, setStorage] = useState<StorageSummary | null>(null)
  const [breakdown, setBreakdown] = useState<StorageBreakdown>({ photo: '0', video: '0', document: '0' })
  const [headerActions, setHeaderActions] = useState<ReactNode>(null)
  const { uploadProgress, setUploadProgress, retryFailedUpload } = useUpload()
  const [uploadCollapsed, setUploadCollapsed] = useState(false)
  const [infoAnchor, setInfoAnchor] = useState<null | HTMLElement>(null)
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterKind, setFilterKind] = useState(searchParams.get('kind') ?? '')
  const [filterAccountId, setFilterAccountId] = useState(searchParams.get('accountId') ?? '')
  const [filterMinSize, setFilterMinSize] = useState(() => {
    const min = searchParams.get('minSize')
    return min ? String(Math.round(Number(min) / (1024 * 1024))) : ''
  })
  const [filterMaxSize, setFilterMaxSize] = useState(() => {
    const max = searchParams.get('maxSize')
    return max ? String(Math.round(Number(max) / (1024 * 1024))) : ''
  })
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const raw = searchParams.get('startDate')
    return raw ? raw.split('T')[0] : ''
  })
  const [filterEndDate, setFilterEndDate] = useState(() => {
    const raw = searchParams.get('endDate')
    return raw ? raw.split('T')[0] : ''
  })

  async function loadSidebarStats() {
    await Promise.all([
      apiFetch<StorageSummary>('/storage/summary').then(setStorage),
      apiFetch<StorageBreakdown>('/storage/breakdown').then(setBreakdown),
    ])
  }

  async function loadConnectedAccounts() {
    try {
      const data = await apiFetch<{ accounts: ConnectedAccount[] }>('/connected-accounts')
      setAccounts(data.accounts)
    } catch (e) {
      console.error('Failed to load accounts for filter dropdown', e)
    }
  }

  useEffect(() => {
    setSearchValue(searchParams.get('q') ?? '')
    setFilterKind(searchParams.get('kind') ?? '')
    setFilterAccountId(searchParams.get('accountId') ?? '')
    const rawMin = searchParams.get('minSize')
    setFilterMinSize(rawMin ? String(Math.round(Number(rawMin) / (1024 * 1024))) : '')
    const rawMax = searchParams.get('maxSize')
    setFilterMaxSize(rawMax ? String(Math.round(Number(rawMax) / (1024 * 1024))) : '')
    const rawStart = searchParams.get('startDate')
    setFilterStartDate(rawStart ? rawStart.split('T')[0] : '')
    const rawEnd = searchParams.get('endDate')
    setFilterEndDate(rawEnd ? rawEnd.split('T')[0] : '')
  }, [searchParams])

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined)
    clearAuthSession()
    navigate('/login')
  }

  function applyFilters() {
    const p = new URLSearchParams()
    const folderId = searchParams.get('folderId')
    if (folderId && location.pathname === '/all-files') p.set('folderId', folderId)
    const q = searchValue.trim()
    if (q) p.set('q', q)
    if (filterKind) p.set('kind', filterKind)
    if (filterAccountId) p.set('accountId', filterAccountId)
    if (filterMinSize) { const b = Number(filterMinSize) * 1024 * 1024; if (!isNaN(b)) p.set('minSize', String(b)) }
    if (filterMaxSize) { const b = Number(filterMaxSize) * 1024 * 1024; if (!isNaN(b)) p.set('maxSize', String(b)) }
    if (filterStartDate) p.set('startDate', new Date(filterStartDate).toISOString())
    if (filterEndDate) p.set('endDate', new Date(filterEndDate).toISOString())
    setFiltersOpen(false)
    navigate({ pathname: '/all-files', search: p.toString() })
  }

  function clearFilters() {
    setFilterKind(''); setFilterAccountId(''); setFilterMinSize(''); setFilterMaxSize(''); setFilterStartDate(''); setFilterEndDate('')
    setFiltersOpen(false)
    const p = new URLSearchParams()
    const folderId = searchParams.get('folderId')
    if (folderId && location.pathname === '/all-files') p.set('folderId', folderId)
    const q = searchValue.trim()
    if (q) p.set('q', q)
    navigate({ pathname: '/all-files', search: p.toString() })
  }

  function searchFiles(event: FormEvent) {
    event.preventDefault()
    applyFilters()
  }

  useEffect(() => {
    apiFetch<{ user: AuthUser }>('/auth/me').then((data) => { setUser(data.user); updateStoredUser(data.user) }).catch(() => undefined)
    loadSidebarStats().catch(() => undefined)
    loadConnectedAccounts().catch(() => undefined)
    window.addEventListener('9drive:storage-changed', loadSidebarStats)
    return () => window.removeEventListener('9drive:storage-changed', loadSidebarStats)
  }, [])

  const activeNav = mobileNavItems.find((item) => location.pathname === item.href)?.value ?? '/all-files'

  const infoOpen = Boolean(infoAnchor)
  const activeGoogle = (storage as any)?.accounts?.filter((a: any) => a.provider === 'google_drive' && a.status === 'connected') ?? []

  const sidebar = (
    <SidebarContent user={user} storage={storage} breakdown={breakdown} onLogout={logout} onNavigate={() => setMobileOpen(false)} />
  )

  const uploadStatusColor = uploadProgress.status === 'error' || uploadProgress.status === 'partial' ? 'error' : uploadProgress.status === 'done' ? 'success' : 'primary'
  const uploadLabel = uploadProgress.status === 'done' ? 'Upload complete' : uploadProgress.status === 'partial' ? 'Completed with errors' : uploadProgress.status === 'error' ? 'Upload failed' : uploadProgress.percent >= 99 ? 'Processing…' : 'Uploading files'

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Permanent sidebar for desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', borderRight: 1, borderColor: 'divider' },
        }}
        open
      >
        {sidebar}
      </Drawer>

      {/* Temporary drawer for mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH },
        }}
      >
        {sidebar}
      </Drawer>

      {/* Main content area */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', maxHeight: '100vh', overflow: 'hidden' }}>
        {/* Top AppBar */}
        <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 2, px: { xs: 2, sm: 3 } }}>
            {/* Mobile menu toggle */}
            <IconButton
              sx={{ display: { xs: 'flex', lg: 'none' } }}
              edge="start"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <MenuIcon />
            </IconButton>

            {/* Search bar */}
            <Box component="form" onSubmit={searchFiles} sx={{ flex: 1, maxWidth: { sm: 480 } }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search Documents"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setFiltersOpen(!filtersOpen)} color={filtersOpen ? 'primary' : 'default'} aria-label="Filters">
                          <TuneIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 9999 },
                  },
                }}
              />
            </Box>

            {/* Header actions from child pages */}
            {headerActions && (
              <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
                {headerActions}
              </Stack>
            )}

            <Box sx={{ ml: 'auto', display: { xs: 'none', lg: 'flex' }, gap: 1 }}>
              <IconButton onClick={toggleTheme} aria-label="Toggle theme">
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              <IconButton
                aria-label="System info"
                onClick={(e) => setInfoAnchor(infoAnchor ? null : e.currentTarget)}
              >
                <NotificationsIcon />
              </IconButton>
            </Box>
          </Toolbar>

          {/* Advanced filters panel */}
          <Collapse in={filtersOpen}>
            <Box sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700}>Advanced Filters</Typography>
                <Button size="small" color="primary" onClick={clearFilters}>Clear All</Button>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>File Type</InputLabel>
                  <Select value={filterKind} label="File Type" onChange={(e) => setFilterKind(e.target.value)}>
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="image">Image</MenuItem>
                    <MenuItem value="video">Video</MenuItem>
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="doc">Document</MenuItem>
                    <MenuItem value="archive">Archive</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Account</InputLabel>
                  <Select value={filterAccountId} label="Account" onChange={(e) => setFilterAccountId(e.target.value)}>
                    <MenuItem value="">All Accounts</MenuItem>
                    {accounts.map((acc) => <MenuItem key={acc.id} value={acc.id}>{acc.email}</MenuItem>)}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField size="small" label="Min MB" type="number" value={filterMinSize} onChange={(e) => setFilterMinSize(e.target.value)} />
                  <Typography variant="caption">–</Typography>
                  <TextField size="small" label="Max MB" type="number" value={filterMaxSize} onChange={(e) => setFilterMaxSize(e.target.value)} />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField size="small" label="From" type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                  <Typography variant="caption">–</Typography>
                  <TextField size="small" label="To" type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                </Stack>
              </Box>
              <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
                <Button variant="outlined" size="small" onClick={() => setFiltersOpen(false)}>Cancel</Button>
                <Button variant="contained" size="small" onClick={applyFilters}>Apply Filters</Button>
              </Stack>
            </Box>
          </Collapse>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 3, lg: 4 }, pb: { xs: 12, lg: 4 } }}>
          <Outlet context={{ setHeaderActions } satisfies DriveLayoutContext} />
        </Box>

        {/* Mobile bottom navigation */}
        <BottomNavigation
          value={activeNav}
          onChange={(_, v) => navigate(v)}
          sx={{
            display: { xs: 'flex', lg: 'none' },
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {mobileNavItems.map((item) => (
            <BottomNavigationAction key={item.value} label={item.label} value={item.value} icon={item.icon} />
          ))}
        </BottomNavigation>
      </Box>

      {/* System Info Popover */}
      <Popover
        open={infoOpen}
        anchorEl={infoAnchor}
        onClose={() => setInfoAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 340, p: 2 } } }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Workspace Status</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Overview of your connections & guidelines</Typography>

        <Stack spacing={1.5}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
              <ShieldIcon fontSize="small" color="success" />
              <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Connection Status</Typography>
            </Stack>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption">Google Drive accounts</Typography>
                <Chip label={`${activeGoogle.length} Connected`} size="small" color={activeGoogle.length > 0 ? 'success' : 'warning'} sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
              </Stack>
            </Paper>
          </Box>

          <Box>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
              <StorageIcon fontSize="small" color="primary" />
              <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Storage Engine</Typography>
            </Stack>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ display: 'block' }}>• <b>DB Type:</b> MySQL (Cloud Database)</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>• <b>Upload Folder:</b> Google Drive <code>9drive</code></Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>• <b>Max Upload:</b> 5 GB per stream</Typography>
            </Paper>
          </Box>

          <Box>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
              <InfoIcon fontSize="small" color="secondary" />
              <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Usage Tips</Typography>
            </Stack>
            <Alert severity="info" sx={{ '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
              Virtual folders exist in database only. Physical files stream to Drive. Use Sync to fetch Drive changes.
            </Alert>
          </Box>
        </Stack>
      </Popover>

      {/* Upload progress panel */}
      {uploadProgress.open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: { xs: 80, lg: 16 },
            right: 16,
            left: { xs: 16, sm: 'auto' },
            width: { sm: 400 },
            maxHeight: '70dvh',
            overflow: 'hidden',
            borderRadius: 4,
            zIndex: 70,
          }}
        >
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {uploadProgress.status === 'done' ? <CheckCircleIcon color="success" fontSize="small" /> :
               uploadProgress.status === 'error' || uploadProgress.status === 'partial' ? <ErrorIcon color="error" fontSize="small" /> :
               <UploadIcon color="primary" fontSize="small" />}
              <Typography variant="body2" fontWeight={700}>{uploadLabel}</Typography>
            </Stack>
            <Stack direction="row">
              <IconButton size="small" onClick={() => setUploadCollapsed(!uploadCollapsed)}>
                <ExpandMoreIcon fontSize="small" sx={{ transform: uploadCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </IconButton>
              <IconButton size="small" onClick={() => setUploadProgress((c) => ({ ...c, open: false }))}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          <Collapse in={!uploadCollapsed}>
            <Box sx={{ p: 2 }}>
              {/* Overall progress */}
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption" noWrap fontWeight={600} sx={{ flex: 1, mr: 1 }}>{uploadProgress.fileName}</Typography>
                <Typography variant="caption" color="text.secondary">{uploadProgress.percent}%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={uploadProgress.percent} color={uploadStatusColor} sx={{ mb: 2 }} />

              {/* Per-file list */}
              {uploadProgress.files.length > 0 && (
                <Stack spacing={1} sx={{ maxHeight: 240, overflowY: 'auto' }}>
                  {uploadProgress.files.map((file, i) => (
                    <Paper key={`${file.name}-${file.size}-${i}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" fontWeight={600} noWrap sx={{ flex: 1, mr: 1 }} title={file.name}>{file.name}</Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {file.status === 'error' && (
                            <Button size="small" color="error" variant="contained" sx={{ fontSize: '0.65rem', height: 22, px: 1, py: 0, minWidth: 0, borderRadius: 9999 }} onClick={() => retryFailedUpload(file.name)}>
                              Retry
                            </Button>
                          )}
                          <Chip
                            label={file.status === 'error' ? 'Failed' : file.status === 'done' ? 'Done' : file.percent >= 99 ? 'Processing' : `${file.percent}%`}
                            size="small"
                            color={file.status === 'error' ? 'error' : file.status === 'done' ? 'success' : 'primary'}
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        </Stack>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={file.percent}
                        color={file.status === 'error' ? 'error' : file.status === 'done' ? 'success' : 'primary'}
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Collapse>
        </Paper>
      )}
    </Box>
  )
}
