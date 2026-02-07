import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsmLogo from '../assets/gsm_logo.png';
import { API_BASE_URL } from '../config';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        contactNumber: '',
        barangay: '',
        address: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorType, setErrorType] = useState('validation'); // validation, email, password, network, server
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Special handling for contact number to only allow numbers and limit to 11 digits
        if (name === 'contactNumber') {
            // Only update if the value is a number and 11 digits or less
            if (value === '' || /^\d{0,11}$/.test(value)) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            setErrorMessage('Please enter your full name.');
            setErrorType('validation');
            setShowErrorModal(true);
            return false;
        }

        if (!formData.email) {
            setErrorMessage('Email address is required.');
            setErrorType('email');
            setShowErrorModal(true);
            return false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setErrorMessage('Please enter a valid email address (e.g., user@example.com).');
            setErrorType('email');
            setShowErrorModal(true);
            return false;
        }

        if (!formData.contactNumber) {
            setErrorMessage('Contact number is required.');
            setErrorType('validation');
            setShowErrorModal(true);
            return false;
        } else if (!/^09\d{9}$/.test(formData.contactNumber)) {
            setErrorMessage('Please enter a valid 11-digit mobile number starting with 09 (e.g., 09123456789).');
            setErrorType('validation');
            setShowErrorModal(true);
            return false;
        }

        if (!formData.barangay) {
            setErrorMessage('Please select your barangay.');
            setErrorType('validation');
            setShowErrorModal(true);
            return false;
        }

        if (!formData.address.trim()) {
            setErrorMessage('Please enter your complete address.');
            setErrorType('validation');
            setShowErrorModal(true);
            return false;
        }

        if (!formData.password) {
            setErrorMessage('Password is required.');
            setErrorType('password');
            setShowErrorModal(true);
            return false;
        } else if (formData.password.length < 8) {
            setErrorMessage('Password must be at least 8 characters long.');
            setErrorType('password');
            setShowErrorModal(true);
            return false;
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            setErrorMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
            setErrorType('password');
            setShowErrorModal(true);
            return false;
        }

        if (!formData.confirmPassword) {
            setErrorMessage('Please confirm your password.');
            setErrorType('password');
            setShowErrorModal(true);
            return false;
        } else if (formData.password !== formData.confirmPassword) {
            setErrorMessage('Passwords do not match. Please make sure both passwords are identical.');
            setErrorType('password');
            setShowErrorModal(true);
            return false;
        }

        if (!formData.agreeTerms) {
            setErrorMessage('You must agree to the terms and conditions to register.');
            setErrorType('validation');
            setShowErrorModal(true);
            return false;
        }

        setErrors(newErrors);
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/register.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    contactNumber: formData.contactNumber,
                    barangay: formData.barangay,
                    address: formData.address,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            if (data.status === 'success') {
                setSuccessMessage(data.message || 'Registration successful! You can now log in.');
                setShowSuccessModal(true);

                // Clear form
                setFormData({
                    fullName: '',
                    email: '',
                    contactNumber: '',
                    barangay: '',
                    address: '',
                    password: '',
                    confirmPassword: '',
                    agreeTerms: false
                });

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                throw new Error(data.message || 'Registration failed');
            }

        } catch (error) {
            console.error('Registration error:', error);

            // Handle different types of errors with specific messages
            if (error.message.includes('Email already registered') || error.message.includes('Duplicate entry')) {
                setErrorMessage('This email is already registered. Please use a different email or log in instead.');
                setErrorType('email');
                setShowErrorModal(true);
            } else if (error.message.includes('Invalid email')) {
                setErrorMessage('The email address you entered is not valid. Please check and try again.');
                setErrorType('email');
                setShowErrorModal(true);
            } else if (error.message.includes('password') || error.message.includes('Password')) {
                setErrorMessage('There was an issue with your password. Please make sure it meets all requirements.');
                setErrorType('password');
                setShowErrorModal(true);
            } else if (error.message.includes('Network') || error.message.includes('fetch')) {
                setErrorMessage('Network error. Please check your internet connection and try again.');
                setErrorType('network');
                setShowErrorModal(true);
            } else if (error.message.includes('Database') || error.message.includes('database')) {
                setErrorMessage('Server error. Please try again later or contact support if the problem persists.');
                setErrorType('server');
                setShowErrorModal(true);
            } else {
                setErrorMessage(error.message || 'Registration failed. Please check your information and try again.');
                setErrorType('server');
                setShowErrorModal(true);
            }

            // Clear any previous field-specific errors
            setErrors(prev => ({
                ...prev,
                email: '',
                password: '',
                confirmPassword: '',
                api: ''
            }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div className="text-center">
                    <img className="mx-auto h-16 w-auto" src={gsmLogo} alt="GSM Logo" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                </div>

                {errors.submit && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{errors.submit}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                required
                                className={`mt-1 block w-full px-3 py-2 border ${errors.fullName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                                placeholder="Juan Dela Cruz"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                            {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                                placeholder="juan.delacruz@example.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                                Contact Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                name="contactNumber"
                                id="contactNumber"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={11}
                                required
                                className={`block w-full px-3 py-2 border ${errors.contactNumber ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                                placeholder="09XXXXXXXXX"
                                value={formData.contactNumber}
                                onChange={handleChange}
                                onKeyPress={(e) => {
                                    // Prevent non-numeric input
                                    if (!/[0-9]/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                            />
                            {errors.contactNumber && <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>}
                        </div>

                        <div>
                            <label htmlFor="barangay" className="block text-sm font-medium text-gray-700">
                                Barangay <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="barangay"
                                name="barangay"
                                required
                                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${errors.barangay ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md`}
                                value={formData.barangay}
                                onChange={handleChange}
                            >
                                <option value="">Select Barangay Number</option>
                                {Array.from({ length: 188 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        Barangay {i + 1}
                                    </option>
                                ))}
                            </select>
                            {errors.barangay && <p className="mt-1 text-sm text-red-600">{errors.barangay}</p>}
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Complete Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="address"
                                name="address"
                                type="text"
                                required
                                className={`mt-1 block w-full px-3 py-2 border ${errors.address ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                                placeholder="House #, Street, Barangay, City"
                                value={formData.address}
                                onChange={handleChange}
                            />
                            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    className={`block w-full pr-10 pl-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                                    placeholder="At least 8 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                                {formData.password.length > 0 && (
                                    <span className={formData.password.length >= 8 ? 'text-green-600' : 'text-yellow-600'}>
                                        {formData.password.length >= 8 ? '✓ ' : '• '}
                                        At least 8 characters
                                    </span>
                                )}
                            </div>
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    className={`block w-full pr-10 pl-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                                    placeholder="Re-enter your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {formData.password && formData.confirmPassword && (
                                <div className="mt-1 text-xs">
                                    {formData.password === formData.confirmPassword ? (
                                        <span className="text-green-600">✓ Passwords match</span>
                                    ) : (
                                        <span className="text-red-600">✗ Passwords do not match</span>
                                    )}
                                </div>
                            )}
                            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            id="agreeTerms"
                            name="agreeTerms"
                            type="checkbox"
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            checked={formData.agreeTerms}
                            onChange={handleChange}
                        />
                        <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-700">
                            I agree to the{' '}
                            <button
                                type="button"
                                className="text-green-600 hover:text-green-500 focus:outline-none"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowTermsModal(true);
                                }}
                            >
                                Terms of Service
                            </button>{' '}
                            and{' '}
                            <a href="#" className="text-green-600 hover:text-green-500">
                                Privacy Policy
                            </a>
                            <span className="text-red-500">*</span>
                        </label>
                    </div>
                    {errors.agreeTerms && <p className="mt-1 text-sm text-red-600">{errors.agreeTerms}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !formData.agreeTerms}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${!formData.agreeTerms ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center text-sm">
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign in
                        </Link>
                    </p>

                </div>

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                            <div className="flex items-center justify-center">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-3 text-center">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Success!</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {successMessage}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                                    onClick={() => setShowSuccessModal(false)}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                    {errorType === 'email' ? 'Email Error' :
                                        errorType === 'password' ? 'Password Error' :
                                            errorType === 'network' ? 'Network Error' :
                                                errorType === 'server' ? 'Server Error' :
                                                    'Validation Error'}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {errorMessage}
                                    </p>
                                </div>
                                {errorType === 'password' && (
                                    <div className="mt-3 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                                        <p className="font-medium mb-1">Password requirements:</p>
                                        <ul className="text-left space-y-1">
                                            <li>• At least 8 characters</li>
                                            <li>• One uppercase letter</li>
                                            <li>• One lowercase letter</li>
                                            <li>• One number</li>
                                        </ul>
                                    </div>
                                )}
                                {errorType === 'email' && (
                                    <div className="mt-3 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                                        <p className="font-medium mb-1">Email format example:</p>
                                        <p>user@example.com</p>
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

            {/* Terms of Service Modal */}
            <div
                style={{
                    display: showTermsModal ? 'flex' : 'none',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}
                onClick={() => setShowTermsModal(false)}
            >
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        maxWidth: '42rem',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '1rem' }}>Terms of Service</h2>
                        <div className="prose max-w-none">
                            <h3>1. Acceptance of Terms</h3>
                            <p>By accessing and using the Government Services Management System (GSM), you accept and agree to be bound by the terms and provision of this agreement.</p>

                            <h3>2. Description of Service</h3>
                            <p>The GSM provides a platform for managing government services, including but not limited to relief distribution, incident reporting, and emergency management.</p>

                            <h3>3. User Responsibilities</h3>
                            <p>As a user of this system, you agree to:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Provide accurate and complete information when registering</li>
                                <li>Maintain the confidentiality of your account credentials</li>
                                <li>Use the system only for lawful purposes</li>
                                <li>Not engage in any activity that disrupts or interferes with the system</li>
                            </ul>

                            <h3>4. Data Privacy</h3>
                            <p>We are committed to protecting your privacy. All personal information collected will be used in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173).</p>

                            <h3>5. System Availability</h3>
                            <p>We strive to maintain system availability but do not guarantee uninterrupted access. Scheduled maintenance may occur from time to time.</p>

                            <h3>6. Limitation of Liability</h3>
                            <p>The local government unit shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the system.</p>

                            <h3>7. Changes to Terms</h3>
                            <p>We reserve the right to modify these terms at any time. Your continued use of the system constitutes acceptance of any changes.</p>

                            <h3>8. Governing Law</h3>
                            <p>These terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines.</p>
                        </div>
                    </div>
                    <div style={{
                        padding: '1rem',
                        backgroundColor: '#f9fafb',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTermsModal(false);
                            }}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#059669',
                                color: 'white',
                                borderRadius: '0.375rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                border: 'none',
                                outline: 'none'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#047857'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#059669'}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
