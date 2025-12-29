import { createBrowserRouter} from 'react-router-dom'
import Register from '../Register'

import Login from '../Login'
import Home from '../Home'

import OTPForm from '../OTPForm'
import ResetPassword from '../ResetPassword'
import PublicLayout from '../layouts/PublicLayout'


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
        element:<Login/>
      },
      {
        path:'/register',
        element:<Register/>
      }
    ]
  },
  
  
  {
     path:'/OTPForm',
    element:<OTPForm/>
  }
   
  
  
])

export default router