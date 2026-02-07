import { ChevronDown, Menu, Settings, Home } from 'lucide-react'
import React from 'react'

function Header({breadcrumb = ['Dashboard'], onGoHome}) {

    const [theme, setTheme] = React.useState('');

    React.useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            setTheme(storedTheme);
            document.documentElement.classList.toggle('dark', storedTheme === 'dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(prefersDark ? 'dark' : 'light');
            document.documentElement.classList.toggle('dark', prefersDark);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    return (
        <div className='bg-white/-80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 dark:bg-slate-800 dark:border-slate-700/50'>
            <div className='flex items-center justify-between'>

                {/* left */}
                <div className='flex items-center'>
                    <div className='flex flex-col'>
                        <div className='hidden md:flex items-center'>
                            <h1 className='text-md font-bold dark:text-white'>DISASTER RISK REDUCTION MANAGEMENT</h1>
                        </div>
                        <div>
                            <span className='text-xs text-slate-500 font-bold'>
                                {breadcrumb.join(' > ')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* right side*/}
                <div className='flex items-center space-x-1 mr-4'>

                    {/* home button */}
                    {onGoHome && (
                        <button 
                            onClick={onGoHome}
                            className='bg-green-500 text-white rounded-xl p-2 hover:bg-green-600 
                            transition-colors cursor-pointer flex items-center gap-2'
                            title="Go to Landing Page"
                        >
                            <Home className='w-5 h-5' />
                            <span className='text-sm font-medium hidden sm:inline'>Home</span>
                        </button>
                    )}

                    {/* dark mode toggle */}
                    <button
                        className='ml-4 rounded-xl p-2 bg-slate-300 text-slate-600 hover:bg-slate-400 dark:bg-slate-700 dark:text-yellow-400 dark:hover:bg-slate-900 transition-colors cursor-pointer'
                        onClick={toggleTheme}
                        aria-label='Toggle dark mode'
                    >
                        {theme === 'dark' ? (
                            // Sun icon for light mode
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
                                <path stroke="currentColor" strokeWidth="2" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07l-1.41-1.41M6.46 6.46L5.05 5.05m13.9 0l-1.41 1.41M6.46 17.54l-1.41 1.41"/>
                            </svg>
                        ) : (
                            // Moon icon for dark mode
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke="currentColor" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Header
