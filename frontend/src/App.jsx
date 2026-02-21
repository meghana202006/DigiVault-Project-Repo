import { useState , useEffect} from 'react'


import {RouterProvider} from 'react-router-dom'
import router from './components/Routes/Router.jsx'
function App() {
  


  return (
    <>
      <RouterProvider router={router}/>
    </>
  )
}

export default App
