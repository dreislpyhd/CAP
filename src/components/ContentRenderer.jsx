import React from 'react';
import Dashboard from './modules/Dashboard/DashboardOverview';
import Homepage from '../UserProfile/Homepage';

// Create placeholder components for missing modules
const Placeholder = ({ name }) => (
    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
        <div className="flex">
            <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </div>
            <div className="ml-3">
                <p className="text-sm text-yellow-700">
                    The <span className="font-medium">{name}</span> module is under development or not available.
                </p>
            </div>
        </div>
    </div>
);

// Create placeholder components for missing modules
const UploadIncident = () => <Placeholder name="Upload Incident" />;
const TDS = () => <Placeholder name="Training & Drill Scheduling" />;
const ToolR = () => <Placeholder name="Resource Management" />;
const Hotlines = () => <Placeholder name="Hotlines" />;
const AlertComponent = () => <Placeholder name="Alerts" />;
const Guidelines = () => <Placeholder name="Guidelines" />;
const MapComponent = () => <Placeholder name="Map" />;
const Evac = () => <Placeholder name="Evacuation" />;
const Reliefbenefiecary = () => <Placeholder name="Relief Beneficiary" />;
const History = () => <Placeholder name="History" />;
const Archives = () => <Placeholder name="Archives" />;

function ContentRenderer({ activeItem }) {
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [displayItem, setDisplayItem] = React.useState(activeItem);

    React.useEffect(() => {
        if (activeItem !== displayItem) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setDisplayItem(activeItem);
                setIsAnimating(false);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [activeItem, displayItem]);

    const getContent = (item) => {
        switch (item) {
            case 'user-profile':
                return <UserProfile />;
            case 'dashboard':
                return <Dashboard />;
            case 'settings':
                return <div>Settings Content</div>;
            
            // Relief Good and Distribution (RGD) cases
            case 'rgd-Beneficiery':
                return <Reliefbenefiecary />;
                case 'rgd-evac':
                return <Evac />;
            
            // Incident Reporting and Response (IRR) cases
            case 'Irr-UI':
                return <UploadIncident />;
            
            // Barangay DRRM Coordination Tool cases
            case 'Tool-Training':
                return <TDS />;
            case 'Tool-Resource':
                return <ToolR />;
            
            // Disaster Early Warning System (WSDR) cases
            case 'alert':
                return <AlertComponent />;
            case 'DEWS-Guidelines':
                return <Guidelines />;
            
            // Hazard & Evacuation System (HES) cases
            case 'map':
                return <MapComponent />;

            // History and Archives cases   
            case 'History':
                return <History />;
            case 'Archives':
                return <Archives />;
            
            
            default:
                return <Dashboard />;
        }
    };

    return (
        <div 
            className={`transition-all duration-300 ease-in-out ${
                isAnimating 
                    ? 'opacity-0 translate-x-4' 
                    : 'opacity-100 translate-x-0'
            }`}
        >
            {getContent(displayItem)}
        </div>
    );
}

export default ContentRenderer;
