import { createBrowserRouter} from 'react-router-dom'

import Home from '../home/Home'
import Register from '../authentication/Register'
import PublicLayout from '../layouts/PublicLayout'

import AuthFlowManager from '../authentication/AuthFlowManager'
import Vault from '../Dashboard'
import ProtectedRoute from '../shared/ProtectedRoute'
import VaultLayout from '../VaultLayout'
import Dashboard from '../Dashboard'
import DocumentsSection from '../DocumentsSection'
import ImagesSection from '../ImagesSection'
import AudioSection from '../AudioSection'
import VideosSection from '../VideosSection'

const router = createBrowserRouter([
  {
    element:<PublicLayout/>,
    children:[
      {
        path:'/',
        element:<Home/>
      },
      {
        path:'/login',
        element:<AuthFlowManager/>
      },
      {
        path:'/register',
        element:<Register/>
      }
     
    ]
  },
  {
    path:'/vault',
    element: (
      <ProtectedRoute>
        <VaultLayout/>
      </ProtectedRoute>
    ),
    children:[
      {
        index : true,
        element:<Dashboard/>
      },
      {
        path:'documents',
        element:<DocumentsSection/>
      },
      {
        path:'images',
        element:<ImagesSection/>
      },
      {
        path:'audio',
        element:<AudioSection/>
      },
      {
        path:'videos',
        element:<VideosSection/>
      },
      // {
      //   path:'private',
      //   element:<PrivateSection/>
      // }
    ]
  }
])

export default router