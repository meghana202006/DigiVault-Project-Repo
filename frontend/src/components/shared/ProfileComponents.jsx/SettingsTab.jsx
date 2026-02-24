import React from 'react'
import {Bell , Shield } from 'lucide-react'

function SettingsTab() {
  return (
    <div>
       <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell size={18} className="text-purple-400" />
                  <div>
                    <h3 className="text-white text-sm font-medium">Notifications</h3>
                    <p className="text-xs text-slate-400">Email notifications</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500"></div>
                </label>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield size={18} className="text-blue-400" />
                  <div>
                    <h3 className="text-white text-sm font-medium">Auto-Backup</h3>
                    <p className="text-xs text-slate-400">Automatic backups</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500"></div>
                </label>
              </div>

              <div className="bg-slate-800 border border-red-900 border-opacity-50 rounded-lg p-3">
                <h3 className="text-red-400 text-sm font-medium mb-1.5">Danger Zone</h3>
                <p className="text-xs text-slate-400 mb-2">Delete account and all data</p>
                <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                  Delete Account
                </button>
              </div>
    </div>
  )
}

export default SettingsTab
