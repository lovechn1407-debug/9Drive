import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { App } from '@capacitor/app'
import { apiFetch } from '@/lib/api'
import { setAuthSession, type AuthUser } from '@/lib/auth'

type AuthResponse = { accessToken: string; refreshToken: string; user: AuthUser }

/**
 * Custom URL scheme used as the deep link target for OAuth callbacks on native.
 * Must match the intent-filter in AndroidManifest.xml.
 * Backend FRONTEND_URL must be set to this value for native builds.
 */
export const NATIVE_SCHEME = 'com.ninedrive.app'

/**
 * Start the Google OAuth flow.
 *
 * - On native (Android/iOS): opens an in-app browser via @capacitor/browser,
 *   listens for the deep link callback (com.ninedrive.app://google-auth?token=...),
 *   then exchanges the handoff token for app JWT tokens.
 *
 * - On web: navigates to the Google OAuth URL directly (existing behaviour).
 *
 * @param onSuccess - called with the resolved user session after successful login
 * @param onError   - called with an error message on failure
 */
export async function startGoogleOAuth(
  onSuccess: (data: AuthResponse) => void,
  onError: (message: string) => void,
): Promise<void> {
  // 1. Fetch Google OAuth URL from backend
  let oauthUrl: string
  try {
    const data = await apiFetch<{ url: string }>('/auth/google/url', { skipAuth: true })
    oauthUrl = data.url
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Could not start Google login')
    return
  }

  if (!Capacitor.isNativePlatform()) {
    // Web: just redirect — backend will redirect back to frontend /google-auth page
    window.location.href = oauthUrl
    return
  }

  // Native: open in-app browser, intercept deep link callback
  let handled = false

  // Listen for the deep link: com.ninedrive.app://google-auth?token=...
  const listenerHandle = await App.addListener('appUrlOpen', async (event) => {
    if (handled) return
    const url = event.url
    if (!url.startsWith(`${NATIVE_SCHEME}://google-auth`)) return

    handled = true
    await listenerHandle.remove()
    await Browser.close().catch(() => undefined)

    const parsed = new URL(url)
    const token = parsed.searchParams.get('token')
    const status = parsed.searchParams.get('status')

    if (status === 'error' || !token) {
      onError('Google sign-in failed. Please try again.')
      return
    }

    try {
      const authData = await apiFetch<AuthResponse>('/auth/google/exchange', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ token }),
      })
      setAuthSession(authData.accessToken, authData.refreshToken, authData.user)
      onSuccess(authData)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.')
    }
  })

  // Open in-app browser
  try {
    await Browser.open({ url: oauthUrl, windowName: '_self' })
  } catch (err) {
    await listenerHandle.remove()
    onError('Failed to open Google sign-in browser.')
  }
}
