import React from 'react';
import axios from 'axios';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/modules/Dashboard/DashboardOverview';
import sidebarItems from './components/Layout/sidebarItems';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Homepage from './components/UserProfile/Homepage';
import Register from './components/Register';

// Import modules
import ReliefBeneficiary from './components/modules/Rgd/reliefBene';
// Add other module imports as needed, following the same pattern
import UploadIncident from "./components/modules/Irr/Irr-Upload";
import IncidentReportPage from "./components/UserProfile/IncidentReportPage";
import HazardMap from "./components/modules/HES/Map";
import EvacuationCenters from "./components/modules/Rgd/Evac";
import History from './components/modules/Historyandarchives/History';
import ToolR from "./components/modules/CoordinationTool/ToolR";
import TDS from "./components/modules/CoordinationTool/TDS";
import AlertSystem from "./components/modules/Wsdr/Alert";
import UserManagement from "./components/UserProfile/UserManagement";
import ReliefFormPage from "./components/UserProfile/ReliefFormPage";
import Settings from "./components/modules/Settings/Settings";


// Wrapper component to handle URL routing and module persistence
function AppContentWrapper() {
    const navigate = useNavigate();
    const location = useLocation();
    
    return <AppContent navigate={navigate} location={location} />;
}

function AppContent({ navigate, location }) {
    const [isDarkMode, setIsDarkMode] = React.useState(false);
    const handleToggleDarkMode = () => setIsDarkMode((prev) => !prev);

    const [showLandingPage, setShowLandingPage] = React.useState(true);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [user, setUser] = React.useState(null);
    const [userType, setUserType] = React.useState('user');
    const [isInitialized, setIsInitialized] = React.useState(false);
    const [loginSuccess, setLoginSuccess] = React.useState(false);
    const inactivityTimeoutRef = React.useRef(null);
    const lastActivityRef = React.useRef(Date.now());
    const [activeItem, setActiveItem] = React.useState(() => {
        // Initialize from localStorage first, then URL as fallback
        const savedModule = localStorage.getItem('activeModule');
        const pathModule = location.pathname.split('/')[1] || 'dashboard';
        
        // Prioritize saved module over URL path
        return savedModule || pathModule || 'dashboard';
    });

    // Sync activeItem with URL and save to localStorage
    React.useEffect(() => {
        if (activeItem) {
            // Save to localStorage
            localStorage.setItem('activeModule', activeItem);
            
            // Update URL (but avoid infinite loops)
            if (activeItem !== 'dashboard') {
                navigate(`/${activeItem}`, { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [activeItem, navigate]);

    // Update activeItem when URL changes
    React.useEffect(() => {
        const pathModule = location.pathname.split('/')[1];
        if (pathModule && pathModule !== activeItem) {
            setActiveItem(pathModule);
            localStorage.setItem('activeModule', pathModule);
        }
    }, [location.pathname]); // Remove activeItem from dependencies

    // Initialize auth state from localStorage
    React.useEffect(() => {
        // Clear any existing auth state to prevent conflicts
        const auth = localStorage.getItem('isAuthenticated') === 'true';
        const savedUser = localStorage.getItem('user');
        
        if (auth && savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                const savedUserType = localStorage.getItem('userType') || 'user';
                
                // Update all state in a single batch
                setUser(userData);
                setUserType(savedUserType);
                
                // Set landing page based on user type and saved preference
                const savedShowLanding = localStorage.getItem('showLandingPage');
                const shouldShowLanding = savedUserType === 'admin' && savedShowLanding !== 'false';
                setShowLandingPage(shouldShowLanding);
                setIsAuthenticated(true);
                
                // Don't reset activeItem - preserve the current page from localStorage
            } catch (e) {
                console.error('Failed to parse user data', e);
                // Clear all auth data on error
                localStorage.clear();
                setIsAuthenticated(false);
                setUser(null);
                setShowLandingPage(true);
            }
        } else {
            // Ensure clean state if not authenticated
            setIsAuthenticated(false);
            setUser(null);
            setShowLandingPage(true);
        }
        
        setIsInitialized(true);
    }, []);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    
    // Handle user logout
    const handleLogout = () => {
        // Clear all user data from localStorage
        localStorage.clear();
        
        // Reset all state
        setIsAuthenticated(false);
        setUser(null);
        setShowLandingPage(true);
        setUserType('user');
        setActiveItem('dashboard');
        
        // Force a full page reload to ensure clean state
        window.location.href = '/login';
        window.location.reload();
    };

    // Inactivity auto-logout (3 minutes)
    React.useEffect(() => {
        const INACTIVITY_LIMIT_MS = 3 * 60 * 1000;
        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        
        const resetTimer = () => {
            lastActivityRef.current = Date.now();
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
            }
            inactivityTimeoutRef.current = setTimeout(() => {
                const now = Date.now();
                const idleFor = now - lastActivityRef.current;
                if (idleFor >= INACTIVITY_LIMIT_MS && localStorage.getItem('isAuthenticated') === 'true') {
                    handleLogout();
                }
            }, INACTIVITY_LIMIT_MS + 1000);
        };
        
        const handleActivity = () => resetTimer();
        
        // Attach activity listeners only when authenticated
        if (isAuthenticated) {
            activityEvents.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
            resetTimer();
        }
        
        return () => {
            activityEvents.forEach(evt => window.removeEventListener(evt, handleActivity));
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
                inactivityTimeoutRef.current = null;
            }
        };
    }, [isAuthenticated]);

    // Ensure axios sends cookies for session-managed APIs
    React.useEffect(() => {
        axios.defaults.withCredentials = true;
    }, []);

    // Helper to find breadcrumb path from sidebarItems
    function getBreadcrumb(itemId) {
        for (const item of sidebarItems) {
            if (item.id === itemId) return [item.label];
            if (item.subItems) {
                const sub = item.subItems.find(sub => sub.id === itemId);
                if (sub) return [item.label, sub.label];
            }
        }
        return ['Dashboard'];
    }

    const handleLoginSuccess = (userData, type = null) => {
        try {
            // Determine user type based on login credentials
            let userType = 'user'; // Default to regular user
            let shouldShowLanding = false;
            
            // Check for admin/coordinator accounts
            if (userData.email === 'drrma36@gmail.com' || userData.email === 'admin@example.com') {
                userType = 'admin';
                shouldShowLanding = true; // Admin gets landing page

            } else {
                // Regular user
                userType = 'user';
                shouldShowLanding = false; // Regular users go directly to homepage
            }
            
            // Update all state in a single batch
            const updatedUser = {
                ...userData,
                role: userType // Ensure role is set correctly
            };
            
            // Update state
            setUser(updatedUser);
            setUserType(userType);
            setShowLandingPage(shouldShowLanding);
            setIsAuthenticated(true);
            setActiveItem('dashboard');
            
            // Save to localStorage
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('userType', userType);
            localStorage.setItem('showLandingPage', shouldShowLanding.toString());
            
            // Trigger re-render
            setLoginSuccess(prev => !prev);
            
        } catch (error) {
            console.error('Login error:', error);
            // Reset state on error
            setIsAuthenticated(false);
            setUser(null);
            setShowLandingPage(true);
            localStorage.clear();
            throw error; // Re-throw to be handled by the Login component
        }
    };

    const handleEnterSystem = () => {
        setShowLandingPage(false);
        setActiveItem('dashboard');
        localStorage.setItem('showLandingPage', 'false');
    };

    const handleGoHome = () => {
        setShowLandingPage(true);
        localStorage.setItem('showLandingPage', 'true');
    };

    // Handle page navigation with URL persistence
    const handlePageChange = (moduleId) => {
        console.log('Navigating to module:', moduleId);
        setActiveItem(moduleId);
        localStorage.setItem('activeModule', moduleId);
        if (moduleId && moduleId !== 'dashboard') {
            navigate(`/${moduleId}`, { replace: true });
        }
    };

    // Show login page if NOT authenticated
    if (!isAuthenticated) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    // Show landing page after login for admin
    if (showLandingPage && userType === 'admin') {
        return <LandingPage onEnterSystem={handleEnterSystem} />;
    }

    // Handle different user types with proper routing
    if (userType === 'user') {
        // Regular User - Render Homepage directly without admin header
        return <Homepage onLogout={handleLogout} />;
    } else if (activeItem === 'profile') {
        // Admin profile route - use Homepage
        return <Homepage onLogout={handleLogout} />;
    } else if (userType === 'admin') {
        // Admin Dashboard with sidebar and header
        return (
            <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 transition-colors duration-200'>
                    <div className='flex h-screen overflow-hidden'>
                        <Sidebar
                            collapsed={sidebarCollapsed}
                            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                            activeItem={activeItem}
                            onPageChange={handlePageChange}
                            onLogout={handleLogout}
                        />
                        <div className='flex-1 flex flex-col overflow-hidden'>
                            <Header
                                sidebarCollapsed={sidebarCollapsed}
                                onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                                breadcrumb={getBreadcrumb(activeItem)}
                                isDarkMode={isDarkMode}
                                onToggleDarkMode={handleToggleDarkMode}
                                onGoHome={handleGoHome}
                                user={user}
                                onLogout={handleLogout}
                            />
                            <div className="flex-1 p-8 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                                {renderModuleContent(activeItem, handleLogout)}
                            </div>
                        </div>
                    </div>
                </div>
        );
    } else if (userType === 'coordinator') {
        // Coordinator Dashboard
        return (
            <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 transition-colors duration-200'>
                    <div className='h-screen flex flex-col'>
                        <Header
                            sidebarCollapsed={true}
                            onToggleSidebar={() => {}}
                            breadcrumb={getBreadcrumb(activeItem)}
                            isDarkMode={isDarkMode}
                            onToggleDarkMode={handleToggleDarkMode}
                            onGoHome={handleGoHome}
                            user={user}
                            onLogout={handleLogout}
                        />
                        <div className="flex-1 p-8 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                            <CoordinatorDashboard user={user} onLogout={handleLogout} />
                        </div>
                    </div>
                </div>
        );
    }

    // Default fallback (should not reach here if user types are properly handled)
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                <p className="text-gray-700 mb-4">You don't have permission to access this page.</p>
                <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    Return to Login
                </button>
            </div>
        </div>
    )
}

// Helper function to render the appropriate module based on activeItem
function renderModuleContent(activeItem, handleLogout) {
    console.log('Rendering module:', activeItem);
    
    // Helper component for placeholder modules
    const PlaceholderModule = ({ title, description }) => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{title}</h1>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <p className="text-gray-700 dark:text-gray-300">{description}</p>
            </div>
        </div>
    );
    
    // Map of all module IDs to their components
    const moduleMap = {
        // Dashboard
        'dashboard': <Dashboard />,
        
        // Relief Goods and Distribution (RGD)
        'rgd-Beneficiery': <ReliefBeneficiary />,
        'rgd-evac': <EvacuationCenters />,
        
        // Incident Reporting and Response (IRR)
        'Irr-UI': <UploadIncident />,
        'irr-incidents': <PlaceholderModule 
                             title="Incident Reports" 
                             description="Incident reporting and management module will be implemented here." 
                             icon="📋" 
                        />,
        'irr-response': <PlaceholderModule 
                            title="Response Teams" 
                            description="Emergency response team management module will be implemented here." 
                        />,
        
        // DRRM Coordination Tool
        'Tool-Training': <TDS />,
        'Tool-Resource': <ToolR />,
        
        // Early Warning System (DEWS)
        'DEWS-Alert': <AlertSystem />,
        
        // Hazard & Evacuation System (HES)
        'HES-Map': <HazardMap />,
        
        // History & Archives
        'History': <History />,
        'Reports': <PlaceholderModule 
                      title="Report Generation" 
                      description="Report generation and export module will be implemented here." 
                   />,
        
        // User Management
        'user-management': <UserManagement />,
        
        // User Profile
        'relief-form': <ReliefFormPage />,
        'incident-report': <IncidentReportPage />,
        
        // Settings
        'settings': <Settings />,
        'profile': <Homepage onLogout={handleLogout} />
    };
    
    // Return the matched component or a default not found message
    return moduleMap[activeItem] || (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Module Not Found</h1>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <p className="text-gray-700 dark:text-gray-300">
                    The requested module could not be found. Module ID: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{activeItem}</code>
                </p>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    This might be a broken link or the module hasn't been implemented yet.
                </p>
            </div>
        </div>
    );
}

// Main App component
function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={<AppContentWrapper />} />
        </Routes>
    );
}

export default App
