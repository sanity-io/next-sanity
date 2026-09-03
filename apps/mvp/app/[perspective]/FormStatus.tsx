'use client'

import {useFormStatus} from 'react-dom'

export function FormStatusLabel({idle, pending}: {idle: string; pending: string}) {
  const status = useFormStatus()

  return status.pending ? pending : idle
}
