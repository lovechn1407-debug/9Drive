import { forwardRef } from 'react'
import MuiTextField, { type TextFieldProps } from '@mui/material/TextField'

export const Input = forwardRef<HTMLInputElement, TextFieldProps>(({ slotProps, ...props }, ref) => {
  return (
    <MuiTextField
      inputRef={ref}
      variant="outlined"
      size="small"
      fullWidth
      slotProps={slotProps}
      {...props}
    />
  )
})
Input.displayName = 'Input'
