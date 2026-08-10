import React from 'react';

export const Tabs = ({ tabs = [], activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex items-center space-x-1 border-b border-zinc-200 overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 py-2.5 px-3.5 font-semibold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all duration-150 ${
              isActive
                ? 'border-zinc-900 text-zinc-900 bg-zinc-100/60 rounded-t-lg font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
