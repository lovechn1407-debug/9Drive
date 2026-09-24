import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { BrandLogo } from '@/components/drive/BrandLogo'
import { apiFetch } from '@/lib/api'
import { setAuthSession, type AuthUser } from '@/lib/auth'

type AuthResponse = { accessToken: string; refreshToken: string; user: AuthUser }

export function GoogleAuthPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('Completing Google sign-in...')
  const [isError, setIsError] = useState(false)
  const token = params.get('token')
  const status = params.get('status')

  useEffect(() => {
    if (status === 'error' || !token) {
      setMessage('Google sign-in failed. Please try again.')
      setIsError(true)
      return
    }

    apiFetch<AuthResponse>('/auth/google/exchange', { method: 'POST', skipAuth: true, body: JSON.stringify({ token }) })
      .then((data) => {
        setAuthSession(data.accessToken, data.refreshToken, data.user)
        navigate('/all-files', { replace: true })
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : 'Google sign-in failed. Please try again.')
        setIsError(true)
      })
  }, [navigate, status, token])

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>
      <Paper elevation={24} sx={{ width: '100%', maxWidth: 420, p: { xs: 4, sm: 6 }, borderRadius: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <BrandLogo />
        </Box>
        
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Google Sign-in
        </Typography>

        {isError ? (
          <Box sx={{ mt: 3, textAlign: 'left' }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>{message}</Alert>
            <Button variant="contained" fullWidth sx={{ mt: 3, py: 1.5, borderRadius: 9999, fontWeight: 700 }} onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <CircularProgress size={48} thickness={4} />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {message}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}
