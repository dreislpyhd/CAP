import React from 'react'
import { ChevronDown, LogOut } from 'lucide-react';
import sidebarItems from './sidebarItems';
import gsmLogo from '../../assets/gsm_logo.png';


function Sidebar({ collapsed, onPageChange, activeItem, onLogout }) {
    const [expandedItem, setExpandedItem] = React.useState(new Set([""]));
    const [activeSubItem, setActiveSubItem] = React.useState(null);
    const [showLogoutModal, setShowLogoutModal] = React.useState(false);

    const toggleExpanded = (itemid) => {
        const newExpanded = new Set(expandedItem);
        if (newExpanded.has(itemid)) {
            newExpanded.delete(itemid);
        } else {
            newExpanded.add(itemid);
        }
        setExpandedItem(newExpanded);
    }

    return (
        <div className="flex">
            <div className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-slate-200/50 flex
            flex-col transition-width duration-200 dark:bg-slate-900 dark:border-slate-700`}>
                {/* Logo */}
                <div className='p-6'>
                    <div className='flex items-center space-x-3'>
                        <div className='w-10 h-10 flex items-center justify-center'>
                            <img src={gsmLogo} alt="AGAP Logo" className='w-10 h-10 object-contain' />
                        </div>

                        {!collapsed && (
                            <div>
                                <h1 className='text-xl font-bold dark:text-white'>GSM</h1>
                                <p className='text-xs text-slate-500'>Admin Dashboard</p>
                            </div>
                        )}
                    </div>
                </div>

                <hr className='border-slate-200 dark:border-slate-700 mx-2' />

                {/* Navigation Links Mapping*/}
                <nav className='flex-1 p-4 space-y-2 overflow-y-auto'>
                    {sidebarItems.map((item) => {
                        return (
                            <div key={item.id}>
                                <button
                                    className={`w-full flex justify-between items-center p-2 rounded-xl 
                                    transition-all duration-200 ${(activeItem === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeSubItem)))
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    onClick={() => {
                                        if (item.subItems) {
                                            toggleExpanded(item.id);
                                        } else {
                                            setActiveSubItem(null);
                                            if (onPageChange) onPageChange(item.id);
                                        }
                                    }}
                                >
                                    <div className='flex items-center space-x-3'>
                                        <item.icon className='w-5 h-5' />
                                        {!collapsed && (
                                            <span className='text-sm font-medium'>{item.label}</span>
                                        )}
                                    </div>
                                    {!collapsed && item.subItems && (
                                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${expandedItem.has(item.id) ? 'rotate-180' : 'rotate-0'
                                            }`} />
                                    )}
                                </button>

                                {!collapsed && item.subItems && (
                                    <div
                                        className={`ml-8 mt-2 space-y-1 border-l-1 border-slate-300 overflow-hidden transition-all duration-300 ease-in-out ${expandedItem.has(item.id)
                                                ? 'max-h-96 opacity-100'
                                                : 'max-h-0 opacity-0'
                                            }`}
                                    >
                                        {item.subItems.map((subitem) => {
                                            return (
                                                <button
                                                    key={subitem.id}
                                                    className={`w-full ml-2 text-sm text-left p-2 rounded-lg transition-all duration-200 ${activeSubItem === subitem.id
                                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold'
                                                            : 'text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-300'
                                                        }`}
                                                    onClick={() => {
                                                        setActiveSubItem(subitem.id);
                                                        if (onPageChange) onPageChange(subitem.id);
                                                    }}
                                                >
                                                    {subitem.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className='p-4 border-t border-slate-200 dark:border-slate-700'>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className='w-full flex items-center space-x-3 p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200'
                    >
                        <LogOut className='w-5 h-5' />
                        {!collapsed && (
                            <span className='text-sm font-medium'>Sign Out</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-red-100">
                                <LogOut className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Sign Out
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Confirm logout action
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            Are you sure you want to sign out? You will need to login again to access the system.
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onLogout();
                                    setShowLogoutModal(false);
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Sidebar
