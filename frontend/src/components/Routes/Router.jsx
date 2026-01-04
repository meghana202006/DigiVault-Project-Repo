import { createBrowserRouter} from 'react-router-dom'

import Home from '../home/Home'
import Register from '../authentication/Register'
import PublicLayout from '../layouts/PublicLayout'

import AuthFlowManager from '../authentication/AuthFlowManager'
import Vault from '../Vault'
import ProtectedRoute from '../shared/ProtectedRoute'


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
        <Vault/>
      </ProtectedRoute>
    )
  }
])

export default router