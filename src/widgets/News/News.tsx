import Titlebar from '@components/TitleBar'
import React from 'react'
import LatestNews from './LatestNews'

export default function News() {
  return (
    <div className='p-4 space-y-4'>
        <Titlebar title='Manage News'/>
        <LatestNews/>
    </div>
  )
}
