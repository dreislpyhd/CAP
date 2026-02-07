// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsmLogo from '../assets/gsm_logo.png';
import gsmBg from '../assets/gsmbg.png';
import { FaFacebookF, FaTwitter, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import { API_BASE_URL } from '../config';

const Login = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpEmail, setOtpEmail] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorType, setErrorType] = useState('validation'); // validation, email, password, network, server
    const otpInputs = Array(6).fill(0);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Enhanced validation with modals
            if (!email && !password) {
                setErrorMessage('Please enter both email and password to login.');
                setErrorType('validation');
                setShowErrorModal(true);
                setLoading(false);
                return;
            }

            if (!email) {
                setErrorMessage('Please enter your email address.');
                setErrorType('email');
                setShowErrorModal(true);
                setLoading(false);
                return;
            }

            if (!password) {
                setErrorMessage('Please enter your password.');
                setErrorType('password');
                setShowErrorModal(true);
                setLoading(false);
                return;
            }

            // Email format validation
            if (!/\S+@\S+\.\S+/.test(email)) {
                setErrorMessage('Please enter a valid email address (e.g., user@example.com).');
                setErrorType('email');
                setShowErrorModal(true);
                setLoading(false);
                return;
            }

            // Make API call to login
            const response = await fetch(`${API_BASE_URL}/login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include' // Important for session cookies
            });

            // First, get the response as text to handle potential non-JSON responses
            const responseText = await response.text();
            let data;

            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response:', responseText);
                setErrorMessage('Invalid response from server. Please try again.');
                setErrorType('server');
                setShowErrorModal(true);
                setLoading(false);
                return;
            }

            console.log('Login response:', data);

            if (data.status === 'otp_required') {
                // Show OTP modal
                setOtpEmail(email);
                setShowOtpModal(true);
            } else if (data.status === 'success') {
                // This is a fallback in case OTP is not required
                handleLoginSuccess(data.user);
            } else {
                // Handle specific login errors
                if (data.message.includes('Invalid credentials') || data.message.includes('wrong password')) {
                    setErrorMessage('Invalid email or password. Please check your credentials and try again.');
                    setErrorType('password');
                } else if (data.message.includes('email not found') || data.message.includes('user not found')) {
                    setErrorMessage('No account found with this email address. Please check your email or register for a new account.');
                    setErrorType('email');
                } else if (data.message.includes('Account not verified') || data.message.includes('verify your email')) {
                    setErrorMessage('Your account has not been verified. Please check your email for verification instructions.');
                    setErrorType('email');
                } else if (data.message.includes('Account suspended') || data.message.includes('banned')) {
                    setErrorMessage('Your account has been suspended. Please contact support for assistance.');
                    setErrorType('server');
                } else {
                    setErrorMessage(data.message || 'Login failed. Please try again.');
                    setErrorType('server');
                }
                setShowErrorModal(true);
            }

        } catch (error) {
            console.error('Login error:', error);

            // Handle network and other errors
            if (error.message.includes('Network') || error.message.includes('fetch')) {
                setErrorMessage('Network error. Please check your internet connection and try again.');
                setErrorType('network');
            } else if (error.message.includes('timeout')) {
                setErrorMessage('Connection timeout. Please check your internet connection and try again.');
                setErrorType('network');
            } else {
                setErrorMessage('An unexpected error occurred. Please try again later.');
                setErrorType('server');
            }
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    // Handle successful login
    const handleLoginSuccess = (userData) => {
        const user = {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            role: 'user' // Default role
        };

        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(user));

        if (onLoginSuccess) {
            onLoginSuccess(user, 'user');
        }

        // Force navigation to trigger re-render
        setTimeout(() => {
            navigate('/homepage');
        }, 100);
    };

    // Handle OTP input change
    const handleOtpChange = (e, index) => {
        const value = e.target.value;

        // Only allow numbers
        if (value && !/^\d*$/.test(value)) return;

        // Update OTP array
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    // Handle OTP input key down (for backspace)
    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    // Verify OTP
    const handleVerifyOtp = async () => {
        setOtpLoading(true);
        setOtpError('');

        try {
            const otpValue = otp.join('');
            if (otpValue.length !== 6) {
                throw new Error('Please enter a valid 6-digit OTP');
            }

            const response = await fetch(`${API_BASE_URL}/verify_otp.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: otpEmail,
                    otp: otpValue
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'OTP verification failed');
            }

            if (data.status === 'success') {
                // Update local storage and state before navigation
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userType', data.user.role || 'user');

                // Update parent component state
                onLoginSuccess && onLoginSuccess(data.user, data.user.role || 'user');

                // Close the OTP modal
                setShowOtpModal(false);

                // Navigate to homepage immediately
                navigate('/homepage');
            } else {
                throw new Error(data.message || 'OTP verification failed');
            }
        } catch (error) {
            console.error('OTP Verification Error:', error);
            setOtpError(error.message || 'An error occurred. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    // Resend OTP
    const resendOtp = async () => {
        setOtpLoading(true);
        setOtpError('');

        try {
            const response = await fetch(`${API_BASE_URL}/login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: otpEmail,
                    password: password,
                    resend_otp: true
                })
            });

            const data = await response.json();

            if (data.status === 'otp_required' || data.status === 'success') {
                setOtp(['', '', '', '', '', '']);
                // Focus first OTP input
                const firstInput = document.getElementById('otp-0');
                if (firstInput) firstInput.focus();
            } else {
                setOtpError(data.message || 'Failed to resend OTP. Please try again.');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            setOtpError('An error occurred. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    // Add animation keyframes in a style tag
    const animationStyle = `
        @keyframes gradientPulse {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient {
            background-size: 200% 200%;
            animation: gradientPulse 8s ease infinite;
        }
    `;

    return (
        <div className="flex flex-col min-h-screen">
            <style>{animationStyle}</style>
            {/* Background with opacity */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: `url(${gsmBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                    opacity: 0.090
                }}
            />
            {/* Content */}
            <div className="relative z-10 flex-1">
                {/* Header */}
                <header className="relative bg-white shadow-sm">
                    <div className="py-2">
                        <div className="container mx-auto px-10">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                                        <img src={gsmLogo} alt="GSM Logo" className="h-10 w-auto" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h1 className="text-3xl lg:text-4xl font-bold" style={{ fontWeight: 700 }}>
                                            <span className="text-blue-500">Go</span>
                                            <span className="text-green-500">Serve</span>
                                            <span className="text-blue-500">PH</span>
                                        </h1>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm">
                                        <span className="text-black-600 text-sm whitespace-nowrap">
                                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-1 bg-orange-400 w-full"></div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-6 pt-4 pb-12 flex-1">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Section - Features */}
                        <div className="text-center lg:text-left mt-2">
                            <h2 className="text-4xl lg:text-5xl font-bold mb-4 ml-2 lg:ml-4 bg-gradient-to-r from-green-600 via-blue-500 to-green-600 text-transparent bg-clip-text animate-gradient">
                                Abot-Kamay mo ang Serbisyong Publiko!
                            </h2>
                        </div>

                        {/* Right Section - Login Form */}
                        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-auto w-full glass-card mt-10">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        placeholder="Enter password"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 pr-10"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? (
                                            <FaEyeSlash className="h-5 w-5" />
                                        ) : (
                                            <FaEye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-500 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Signing in...
                                        </>
                                    ) : 'Login'}
                                </button>

                                <div className="text-center">
                                    <p className="text-gray-600">
                                        No account yet?{' '}
                                        <Link to="/register" className="text-blue-400 hover:underline font-semibold">
                                            Register here
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div> {/* Close flex-1 div */}

            {/* OTP Verification Modal */}
            {showOtpModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                        <button
                            onClick={() => setShowOtpModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <FaTimes size={20} />
                        </button>

                        <h2 className="text-2xl font-bold mb-4 text-center">Enter OTP</h2>
                        <p className="text-gray-600 mb-6 text-center">
                            We've sent a 6-digit verification code to <span className="font-semibold">{otpEmail}</span>
                        </p>

                        {otpError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {otpError}
                            </div>
                        )}

                        <div className="flex justify-center space-x-2 mb-6">
                            {otpInputs.map((_, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength="1"
                                    value={otp[index]}
                                    onChange={(e) => handleOtpChange(e, index)}
                                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                    className="w-12 h-12 border border-gray-300 rounded text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus={index === 0}
                                    disabled={otpLoading}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleVerifyOtp}
                            disabled={otpLoading || otp.some(digit => !digit)}
                            className={`w-full py-3 px-4 rounded-md text-white font-medium ${otpLoading || otp.some(digit => !digit)
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {otpLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <p className="text-sm text-gray-500 mt-4 text-center">
                            Didn't receive a code?{' '}
                            <button
                                onClick={resendOtp}
                                className="text-blue-600 hover:underline"
                                disabled={otpLoading}
                            >
                                Resend OTP
                            </button>
                        </p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-green-600 text-white py-4 w-full relative z-10">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row justify-between items-center">
                        <div className="text-center lg:text-left mb-2 lg:mb-0">
                            <h3 className="text-lg font-bold mb-1">Government Services Management System</h3>
                            <p className="text-xs opacity-90">
                                For any inquiries, please call 122 or email helpdesk@gov.ph
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-3">
                                <button type="button" className="text-xs hover:underline">TERMS OF SERVICE</button>
                                <span>|</span>
                                <button type="button" className="text-xs hover:underline">PRIVACY POLICY</button>
                            </div>
                            <div className="flex space-x-2">
                                <a href="#" className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                                    <FaFacebookF className="text-white text-xs" />
                                </a>
                                <a href="#" className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors">
                                    <FaTwitter className="text-white text-xs" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                        <div className="flex items-center justify-center">
                            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${errorType === 'email' ? 'bg-orange-100' :
                                    errorType === 'password' ? 'bg-purple-100' :
                                        errorType === 'network' ? 'bg-yellow-100' :
                                            errorType === 'server' ? 'bg-red-100' :
                                                'bg-red-100'
                                }`}>
                                {errorType === 'email' ? (
                                    <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                ) : errorType === 'password' ? (
                                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                ) : errorType === 'network' ? (
                                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                                    </svg>
                                ) : errorType === 'server' ? (
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                ) : (
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 text-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {errorType === 'email' ? 'Login Error - Email' :
                                    errorType === 'password' ? 'Login Error - Password' :
                                        errorType === 'network' ? 'Network Error' :
                                            errorType === 'server' ? 'Server Error' :
                                                'Validation Error'}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    {errorMessage}
                                </p>
                            </div>
                            {errorType === 'email' && (
                                <div className="mt-3 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                                    <p className="font-medium mb-1">Login tips:</p>
                                    <ul className="text-left space-y-1">
                                        <li>• Check your email spelling</li>
                                        <li>• Use the email you registered with</li>
                                        <li>• Contact support if you forgot your email</li>
                                    </ul>
                                </div>
                            )}
                            {errorType === 'password' && (
                                <div className="mt-3 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                                    <p className="font-medium mb-1">Password tips:</p>
                                    <ul className="text-left space-y-1">
                                        <li>• Check caps lock (passwords are case-sensitive)</li>
                                        <li>• Use the "Forgot Password" link if needed</li>
                                        <li>• Make sure you're using the correct account</li>
                                    </ul>
                                </div>
                            )}
                            {errorType === 'network' && (
                                <div className="mt-3 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                                    <p className="font-medium mb-1">Connection tips:</p>
                                    <ul className="text-left space-y-1">
                                        <li>• Check your internet connection</li>
                                        <li>• Try refreshing the page</li>
                                        <li>• Contact support if the problem persists</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <button
                                type="button"
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${errorType === 'email' ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' :
                                        errorType === 'password' ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' :
                                            errorType === 'network' ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' :
                                                errorType === 'server' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
                                                    'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                    }`}
                                onClick={() => setShowErrorModal(false)}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;