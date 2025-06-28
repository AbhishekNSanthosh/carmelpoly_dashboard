import Edit from '@widgets/(student)/Edit'
import React from 'react'

export default function EditPage({code}: { code: string }) {
  return (
   <Edit code={code} />
  )
}
