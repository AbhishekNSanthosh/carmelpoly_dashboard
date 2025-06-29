import Edit from '@widgets/Department/Edit'
import React from 'react'

export default function EditPage({code}: { code: string }) {
  return (
   <Edit code={code} />
  )
}
