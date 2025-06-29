import Titlebar from '@components/TitleBar'
import React from 'react'
import EventManager from './Events'

export default function LatestEvents() {
  return (
    <div className='p-4 space-y-4'>
        <Titlebar title='Manage Events'/>
        <div className="flex">
          <EventManager/>
        </div>
    </div>
  )
}
