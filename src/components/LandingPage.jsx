import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Landmark, 
    TreeDeciduous, 
    Building, 
    Droplets, 
    CandlestickChart,
    Shield,
    ArrowRight
} from 'lucide-react';

const LandingPage = ({ onEnterSystem }) => {
    const navigate = useNavigate();
    
    const features = [
        {
            icon: LayoutDashboard,
            title: "Dashboard Overview",
            description: "Comprehensive view of all DRRM activities",
            moduleId: "dashboard"
        },
        {
            icon: Landmark,
            title: "Relief & Distribution",
            description: "Manage relief goods and track beneficiaries",
            moduleId: "rgd-Beneficiery"
        },
        {
            icon: TreeDeciduous,
            title: "Incident Reporting",
            description: "Report and track incidents with classification",
            moduleId: "Irr-UI"
        },
        {
            icon: Building,
            title: "DRRM Coordination",
            description: "Barangay-level coordination tools",
            moduleId: "Tool-Training"
        },
        {
            icon: Droplets,
            title: "Early Warning System",
            description: "Real-time disaster alerts and monitoring",
            moduleId: "DEWS-Alert"
        },
        {
            icon: CandlestickChart,
            title: "Hazard Mapping System",
            description: "Hazard mapping and evacuation management",
            moduleId: "HES-Map"
        }
    ];

    const handleFeatureClick = (moduleId) => {
        onEnterSystem();
        navigate(`/${moduleId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50]/20 to-[#4A90E2]/20"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="bg-[#4CAF50] p-3 rounded-xl">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            <span className="animated-gradient-title">Disaster Risk Reduction & Management System</span>
                        </h1>
                        <style>{`
                            @keyframes gradientFlow {
                                0% {
                                    background-position: 0% 50%;
                                }
                                50% {
                                    background-position: 100% 50%;
                                }
                                100% {
                                    background-position: 0% 50%;
                                }
                            }
                            
                            .animated-gradient-title {
                                background: linear-gradient(90deg, #4CAF50 0%, #4A90E2 50%, #4CAF50 100%);
                                background-size: 200% 200%;
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                background-clip: text;
                                animation: gradientFlow 4s ease infinite;
                            }
                        `}</style>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                            Comprehensive platform for barangay-level disaster preparedness, response, and recovery.
                        </p>
                        <button
                            onClick={onEnterSystem}
                            className="bg-[#4CAF50] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#45a049] transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 mx-auto"
                        >
                            Enter System
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Comprehensive DRRM Solutions
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Our integrated platform provides all the tools needed for effective disaster risk reduction and management.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                onClick={() => handleFeatureClick(feature.moduleId)}
                                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                            >
                                <div className="bg-[#4CAF50] p-4 rounded-lg w-fit mb-6">
                                    <feature.icon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-[#4A90E2] py-20">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Enhance Your Community's Disaster Preparedness?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join hundreds of barangays already using our system to protect their communities.
                    </p>
                    <button
                        onClick={onEnterSystem}
                        className="bg-white text-[#4A90E2] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 mx-auto"
                    >
                        Get Started Now
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-900 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-[#4CAF50] p-2 rounded-xl">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <p className="text-gray-400">
                        © 2024 DRRM Management System. Empowering communities through technology.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
