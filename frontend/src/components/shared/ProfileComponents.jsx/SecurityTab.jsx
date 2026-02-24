import React from 'react'
import {Lock} from 'lucide-react'

function SecurityTab() {
  return (
    <div>
       <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    name="currentPassword"
                    //value={formData.currentPassword}
                    //onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500 focus:ring-opacity-30 transition-all"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    name="newPassword"
                    //value={formData.newPassword}
                    //onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500 focus:ring-opacity-30 transition-all"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    name="confirmPassword"
                    //value={}
                    //onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500 focus:ring-opacity-30 transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white text-sm font-medium">Two-Factor Auth</h3>
                    <p className="text-xs text-slate-400">Extra security layer</p>
                  </div>
                  <button className="px-3 py-1.5 text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all">
                    Enable
                  </button>
                </div>
              </div>
    
    </div>
  )
}

export default SecurityTab
