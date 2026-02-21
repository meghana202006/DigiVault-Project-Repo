import { io } from 'socket.io-client';

const URL = 'http://localhost:5000';

export const socket = io(URL,{
    auth:{
        token:localStorage.getItem('accessToken')
    },
    autoConnect:true,
    recConnnectAttempts:5
})