// Sidebar items configuration for Sidebar.jsx
import { LayoutDashboard, Landmark, TreeDeciduous, Building, Settings, Droplets, CandlestickChart, Users, UserCog } from 'lucide-react';

const sidebarItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    {
        id: 'rgd', 
        icon: Landmark, 
        label: 'Relief Beneficiary & Evacuees',
        subItems: [
            { id: 'rgd-Beneficiery', label: 'Relief Beneficiary' },    
            { id: 'rgd-evac', label: 'Evacuation' },
        ]
    },
    {
        id: 'Irr', 
        icon: TreeDeciduous, 
        label: 'Incident Reporting and Responselog',
        subItems: [
            { id: 'Irr-UI', label: 'Incident Report' }
        ]
    },
    {
        id: 'Tool', 
        icon: Building, 
        label: 'Barangay DRRM Coordination Tool',
        subItems: [
            { id: 'Tool-Training', label: 'Training & Drill Scheduling' },
            { id: 'Tool-Resource', label: 'Emergency Assistance Resources' }
        ]
    },
    {
        id: 'Earlywarning', 
        icon: Droplets, 
        label: 'Disaster Early Warning System',
        subItems: [
            { id: 'DEWS-Alert', label: 'Alert System' },
        ]
    },

    {
        id: 'HES', 
        icon: CandlestickChart, 
        label: 'Hazard System',
        subItems: [
            { id: 'HES-Map', label: 'Hazard Map' }
        ]
    },
    {
        id: 'History and archives', 
        icon: CandlestickChart, 
        label: 'History',
        subItems: [
            { id: 'History', label: 'History' },
        ]
    },
    { 
        id: 'user-management', 
        icon: UserCog, 
        label: 'User Management' 
    },
    { id: 'settings', icon: Settings, label: 'Settings' }
];

export default sidebarItems;
