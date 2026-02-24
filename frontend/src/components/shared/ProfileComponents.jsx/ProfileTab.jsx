import React from 'react'
import { User , Mail } from 'lucide-react'

function ProfileTab() {
  return (
    <>
      <div className='px-2 flex flex-col gap-5'>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    name="name"
                    value={""}
                    //onChange={}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500 focus:ring-opacity-30 transition-all"
                  />
                </div>
                <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={""}
                    //onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500 focus:ring-opacity-30 transition-all"
                  />
                </div>
              </div>
              <div className="pt-2">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                  <h3 className="text-white text-sm font-medium mb-2">Storage Usage</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>300 GB used of 1 TB</span>
                      <span>30%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
    </>
  )
}

export default ProfileTab
