import React from 'react'

const BreadCrumbs = ({ path, onNavigate }) => (
  <nav className="flex items-center gap-2 mb-6 text-slate-400 font-medium">
    <button 
      onClick={() => onNavigate(null)} 
      className="hover:text-white transition-colors"
    >
      Documents
    </button>
    {path.map((crumb, index) => (
      <React.Fragment key={crumb._id}>
        <span className="text-slate-600">/</span>
        <button 
          onClick={() => onNavigate(crumb)}
          className={`hover:text-white transition-colors ${index === path.length - 1 ? 'text-blue-400' : ''}`}
        >
          {crumb.name}
        </button>
      </React.Fragment>
    ))}
  </nav>
);
export default BreadCrumbs
