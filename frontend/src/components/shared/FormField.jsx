import React from 'react'
import { useMemo } from 'react';
import {registerStyles as styles} from '../../styles/tailwindClasses'

// 1. Define a reusable component inside or outside your Register component
const FormField = ({ 
  label, 
  icon: Icon, 
  type = "text", 
  status, 
  rightElement, 
  ...props 
}) => {
  // Determine border color based on status
 const statusColor = useMemo(() => {
  // Red if explicitly false
  if (status?.available === false || status?.matches === false || status?.isValid === false) {
    return 'border-red-400 focus:border-red-400';
  }
  // Green if explicitly true
  if (status?.available === true || status?.matches === true || status?.isValid === true) {
    return 'border-green-400 focus:border-green-400';
  }
  return ''; // default (Blue/Slate)
}, [status]);

  return (
    <div className="flex flex-col gap-1.5 w-full group">
      <label className={styles.labelBase}>{label}</label>
      
      <div className="relative flex items-center">
        {/* LEFT ICON - Centered vertically regardless of label */}
        {/* LEFT ICON */}
        <div className="absolute left-4 inset-y-0 flex items-center justify-center text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
        <Icon size={28} />
        </div>
        <input
          {...props}
          type={type}
          className={`${styles.inputField} pl-14 ${statusColor} transition-all`}
        />

        {/* RIGHT ELEMENT (Eye icon or Status spinners) */}
        <div className="absolute right-4 flex items-center gap-2">
          {rightElement}
        </div>
      </div>

      {/* ERROR/SUCCESS MESSAGES */}
      {/* ERROR/SUCCESS MESSAGES */}
    {props.value && status?.message && (
        <p className={`text-xs mt-1 ml-1 flex items-center gap-1 ${
            (status.available || status.matches || status.isValid) ? 'text-green-400' : 'text-red-400'
        }`}>
        {status.message}
        </p>
    )}
    </div>
  );
};

export default FormField;
