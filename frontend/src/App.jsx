import { useState , useEffect} from 'react'


import {RouterProvider} from 'react-router-dom'
import router from './components/Routes/Router.jsx'
function App() {
  
//   useEffect(() => {
//   const lenis = new Lenis()

//   function raf(time) {
//     lenis.raf(time)
//     requestAnimationFrame(raf)
//   }

//   requestAnimationFrame(raf)
// }, [])

  return (
    <>
      <RouterProvider router={router}/>
    </>
  )
}

export default App
