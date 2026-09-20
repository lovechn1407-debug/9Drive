import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'

export interface LocalDeviceItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  mtime: number
}

/**
 * Checks if the current web app is running inside a Capacitor native container (e.g. Android APK).
 */
export function isNativeMobile(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Requests filesystem access permissions on the native device.
 */
export async function requestMobileStoragePermission(): Promise<boolean> {
  if (!isNativeMobile()) return true

  try {
    const status = await Filesystem.checkPermissions()
    if (status.publicStorage === 'granted') {
      return true
    }
    const request = await Filesystem.requestPermissions()
    return request.publicStorage === 'granted'
  } catch (error) {
    console.warn('Native permission request failed or non-mobile browser context', error)
    return false
  }
}

/**
 * Lists contents of a local device directory.
 */
export async function listLocalDeviceDirectory(dirPath = ''): Promise<LocalDeviceItem[]> {
  if (!isNativeMobile()) return []

  try {
    const res = await Filesystem.readdir({
      path: dirPath,
      directory: Directory.ExternalStorage
    })

    return res.files.map((f: { name: string; uri?: string; type: string; size?: number; mtime?: number }) => ({
      name: f.name,
      path: f.uri || `${dirPath}/${f.name}`,
      type: f.type === 'directory' ? 'directory' : 'file',
      size: f.size || 0,
      mtime: f.mtime || Date.now()
    }))
  } catch (error) {
    console.error('Error reading local device directory:', error)
    return []
  }
}

/**
 * Reads a local device file and returns a JavaScript File object ready for upload.
 */
export async function readLocalDeviceFile(filePath: string, fileName: string): Promise<File | null> {
  if (!isNativeMobile()) return null

  try {
    const readFile = await Filesystem.readFile({
      path: filePath
    })

    let blob: Blob
    if (typeof readFile.data === 'string') {
      const byteCharacters = atob(readFile.data.replace(/^data:.*?;base64,/, ''))
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      blob = new Blob([byteArray])
    } else {
      blob = readFile.data
    }

    return new File([blob], fileName, { type: blob.type || 'application/octet-stream' })
  } catch (error) {
    console.error('Error reading native device file:', error)
    return null
  }
}
