import type { ReactNode } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

export function DummyModal({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  children: ReactNode
  onClose: () => void
  className?: string
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
    >
      <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
        {title}
        <IconButton
          aria-label="Close modal"
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      {description && (
        <DialogContentText sx={{ px: 3, pb: 0, pt: 0, fontSize: '0.875rem' }}>
          {description}
        </DialogContentText>
      )}
      <DialogContent sx={{ pt: 2 }}>{children}</DialogContent>
    </Dialog>
  )
}
