import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { ClipboardList, Check, X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReliefFormPage = () => {
  const navigate = useNavigate();
  
  // Reducer for managing localStorage-related state
  const localStorageReducer = (state, action) => {
    switch (action.type) {
      case 'LOAD_FROM_STORAGE':
        return {
          ...state,
          ...action.payload
        };
      case 'SET_APPLICATION_STATUS':
        return {
          ...state,
          applicationStatus: action.payload
        };
      case 'SET_FORM_LOCKED':
        return {
          ...state,
          isFormLocked: action.payload
        };
      case 'SET_CONTACT_NUMBER':
        return {
          ...state,
          submittedContactNumber: action.payload
        };
      default:
        return state;
    }
  };

  const [localStorageState, dispatch] = useReducer(localStorageReducer, {
    applicationStatus: null,
    isFormLocked: false,
    submittedContactNumber: ''
  });

  const { applicationStatus, isFormLocked, submittedContactNumber } = localStorageState;
  
  // List of all 188 barangays for the dropdown
  const barangays = Array.from({ length: 188 }, (_, i) => `Barangay ${i + 1}`);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    contact_number: '',
    address: '',
    barangay: '',
    family_size: 1,
    zone: 'South Caloocan',
    status: 'Pending'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load saved application status from localStorage on component mount
  useEffect(() => {
    console.log('Loading saved application status from localStorage...');
    const savedStatus = localStorage.getItem('reliefApplicationStatus');
    const savedContact = localStorage.getItem('reliefContactNumber');
    const savedLock = localStorage.getItem('reliefFormLocked');
    
    console.log('Saved data:', { savedStatus, savedContact, savedLock });
    
    // Prepare updates object
    const updates = {};
    
    if (savedStatus) {
      try {
        const parsedStatus = JSON.parse(savedStatus);
        console.log('Parsed status:', parsedStatus);
        updates.applicationStatus = parsedStatus;
      } catch (e) {
        console.error('Error parsing saved status:', e);
      }
    }
    
    if (savedContact) {
      console.log('Setting contact number:', savedContact);
      updates.submittedContactNumber = savedContact;
    }
    
    if (savedLock === 'true') {
      console.log('Setting form lock to true');
      updates.isFormLocked = true;
    }
    
    // Apply all updates at once using reducer
    if (Object.keys(updates).length > 0) {
      dispatch({ type: 'LOAD_FROM_STORAGE', payload: updates });
    }
  }, []); // Empty dependency array - only run once on mount

  // Save application status to localStorage whenever it changes
  useEffect(() => {
    if (applicationStatus) {
      localStorage.setItem('reliefApplicationStatus', JSON.stringify(applicationStatus));
    } else {
      localStorage.removeItem('reliefApplicationStatus');
    }
  }, [applicationStatus]);

  // Save form lock status to localStorage
  useEffect(() => {
    localStorage.setItem('reliefFormLocked', isFormLocked.toString());
  }, [isFormLocked]);

  // Save contact number to localStorage
  useEffect(() => {
    if (submittedContactNumber) {
      localStorage.setItem('reliefContactNumber', submittedContactNumber);
    } else {
      localStorage.removeItem('reliefContactNumber');
    }
  }, [submittedContactNumber]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for contact number field
    if (name === 'contact_number') {
      // Only allow numbers and limit to 11 digits
      const numbersOnly = value.replace(/\D/g, '').slice(0, 11);
      setFormData(prev => ({
        ...prev,
        [name]: numbersOnly
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'family_size' || name === 'age' 
        ? value === '' ? '' : parseInt(value) || ''
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset previous errors and status
    setError('');
    setStatus('');
    setIsSubmitting(true);
    
    // Validate required fields
    const requiredFields = {
      name: 'Full Name',
      contact_number: 'Contact Number',
      address: 'Address',
      barangay: 'Barangay'
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !formData[field])
      .map(([_, label]) => label);
      
    if (missingFields.length > 0) {
      setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    // Validate contact number
    if (formData.contact_number.length !== 11) {
      setError('Please enter a valid 11-digit contact number');
      setIsSubmitting(false);
      return;
    }

    if (!agreed) {
      setError('Please agree to the terms and conditions');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const submissionData = {
        name: formData.name.trim(),
        age: formData.age || null,
        gender: formData.gender,
        contact: formData.contact_number.trim(),
        contact_number: formData.contact_number.trim(),
        address: formData.address.trim(),
        barangay: formData.barangay,
        family_members: formData.family_size,
        family_size: formData.family_size,
        zone: formData.zone,
        status: 'Pending',
        evacuation_id: 1,
        user_id: userData.id || null
      };

      console.log('Submitting data:', submissionData);

      const endpoint = 'http://localhost/gsm/backend/api/rgd/evacuees.php';
      console.log('Attempting to connect to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(submissionData)
      });

      // First check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an invalid response. Please try again.');
      }

      const responseData = await response.json();
      
      if (!response.ok) {
        const errorMsg = responseData.message || responseData.error || `Server returned status ${response.status}`;
        console.error('Server error:', { status: response.status, error: errorMsg });
        throw new Error(errorMsg);
      }

      // Check for success response from backend
      if (!responseData.success) {
        const errorMsg = responseData.message || 'Failed to submit application';
        console.error('Application error:', errorMsg);
        throw new Error(errorMsg);
      }

      // Success
      setShowSuccessModal(true);
      
      // Store the contact number for status checking before resetting form
      dispatch({ type: 'SET_CONTACT_NUMBER', payload: formData.contact_number.trim() });
      
      // Lock form and set application status
      dispatch({ type: 'SET_FORM_LOCKED', payload: true });
      dispatch({ 
        type: 'SET_APPLICATION_STATUS', 
        payload: {
          status: 'Pending',
          submittedAt: new Date().toISOString()
        }
      });
      
      // Reset form
      setFormData({
        name: '',
        age: '',
        gender: 'Male',
        contact_number: '',
        address: '',
        barangay: '',
        family_size: 1,
        zone: 'South Caloocan',
        status: 'Pending'
      });
      setAgreed(false);
      
    } catch (error) {
      console.error('Submission error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const termsOfAgreement = [
    "I certify that all information provided is true and accurate to the best of my knowledge.",
    "I understand that providing false information may result in the denial of relief assistance.",
    "I agree to the collection and processing of my personal data for the purpose of relief distribution.",
    "I understand that approval of my application is subject to verification and available resources.",
    "I agree to be contacted through the provided contact number for updates regarding my application.",
    "I understand that submission of this form does not guarantee approval of relief assistance.",
    "I agree to comply with all government regulations and guidelines related to relief distribution."
  ];

  const checkStatus = useCallback(async () => {
    if (isFormLocked && applicationStatus && applicationStatus.status === 'Pending') {
      try {
        // Debug: Check if we have the contact number
        if (!submittedContactNumber) {
          console.error('No contact number available for status checking');
          return null;
        }
        
        console.log('Checking status for contact:', submittedContactNumber);
        
        // Check the actual status from the database
        // This will detect when an admin changes the status in evac.jsx
        const response = await fetch(`http://localhost/gsm/backend/api/rgd/check-status.php?contact=${encodeURIComponent(submittedContactNumber)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        console.log('Status check response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Status check response data:', data);
          
          if (data.success && data.status !== applicationStatus.status) {
            // Status has changed from admin action
            console.log('Status changed from', applicationStatus.status, 'to', data.status);
            
            const newStatus = {
              ...applicationStatus,
              status: data.status,
              updatedAt: data.updated_at || new Date().toISOString()
            };
            
            dispatch({ 
              type: 'SET_APPLICATION_STATUS', 
              payload: newStatus
            });
            
            // Update localStorage with the new status
            localStorage.setItem('reliefApplicationStatus', JSON.stringify(newStatus));
          }
        } else {
          console.error('Status check failed:', response.status, response.statusText);
        }
        
      } catch (error) {
        console.error('Error checking application status:', error);
      }
    }
    return null;
  }, [isFormLocked, submittedContactNumber]);

  useEffect(() => {
    // Check status every 10 seconds for real admin updates
    const interval = setInterval(() => {
      checkStatus();
    }, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [checkStatus]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <ClipboardList className="h-6 w-6 mr-2 text-yellow-600" />
        Relief Request Form
      </h1>
      
      {/* Application Status Display - Always visible when form is locked */}
      {isFormLocked && (
        <div className={`mb-6 p-6 rounded-lg border-2 shadow-lg ${
          applicationStatus?.status === 'Approved' 
            ? 'bg-green-50 border-green-300 text-green-800'
            : applicationStatus?.status === 'Declined'
            ? 'bg-red-50 border-red-300 text-red-800'
            : 'bg-yellow-50 border-yellow-300 text-yellow-800'
        }`}>
          <div className="flex items-center mb-3">
            <CheckCircle className="w-6 h-6 mr-3" />
            <h2 className="text-xl font-bold">
              Application {applicationStatus?.status || 'Pending'}
            </h2>
          </div>
          <p className="text-base mb-4">
            {applicationStatus?.status === 'Approved' 
              ? 'Your relief request has been approved. You can now submit a new application if needed.'
              : applicationStatus?.status === 'Declined'
              ? 'Your relief request has been declined. You can now submit a new application if needed.'
              : 'Your application is currently being processed. Please wait for admin approval.'
            }
          </p>
          {applicationStatus?.submittedAt && (
            <p className="text-sm opacity-75 mb-4">
              Submitted: {new Date(applicationStatus.submittedAt).toLocaleString()}
            </p>
          )}
          {applicationStatus?.status === 'Approved' || applicationStatus?.status === 'Declined' ? (
            <button
              onClick={() => {
                // Clear localStorage and reset all states
                localStorage.removeItem('reliefApplicationStatus');
                localStorage.removeItem('reliefFormLocked');
                localStorage.removeItem('reliefContactNumber');
                
                dispatch({ type: 'SET_FORM_LOCKED', payload: false });
                dispatch({ type: 'SET_APPLICATION_STATUS', payload: null });
                dispatch({ type: 'SET_CONTACT_NUMBER', payload: '' });
                setFormData({
                  name: '',
                  age: '',
                  gender: 'Male',
                  contact_number: '',
                  address: '',
                  barangay: '',
                  family_size: 1,
                  zone: 'South Caloocan',
                  status: 'Pending'
                });
                setAgreed(false);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-base font-medium"
            >
              Submit New Application
            </button>
          ) : null}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      <div className={`bg-white rounded-lg shadow p-6 ${isFormLocked ? 'opacity-75' : ''}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Enter your full name" 
                required
                disabled={isFormLocked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
                name="age" 
                value={formData.age} 
                onChange={handleChange} 
                placeholder="Enter your age" 
                min="0"
                disabled={isFormLocked}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select 
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange}
              disabled={isFormLocked}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number
              {formData.contact_number && formData.contact_number.length !== 11 && (
                <span className="text-red-500 text-xs ml-1">(Must be 11 digits)</span>
              )}
            </label>
            <input 
              type="tel" 
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                formData.contact_number && formData.contact_number.length !== 11 
                  ? 'border-red-500' 
                  : 'border-gray-300'
              }`} 
              name="contact_number" 
              value={formData.contact_number} 
              onChange={handleChange} 
              placeholder="09XXXXXXXXX" 
              required
              inputMode="numeric"
              pattern="[0-9]*"
              disabled={isFormLocked}
            />
            {formData.contact_number && formData.contact_number.length !== 11 && (
              <p className="mt-1 text-sm text-red-600">
                Please enter a valid 11-digit contact number
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea 
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
              rows="3" 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              placeholder="Enter your full address"
              required
              disabled={isFormLocked}
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
            <select 
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
              name="barangay" 
              value={formData.barangay} 
              onChange={handleChange}
              required
              disabled={isFormLocked}
            >
              <option value="">Select barangay</option>
              {barangays.map((barangay, index) => (
                <option key={index} value={barangay}>{barangay}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Family Size</label>
            <input 
              type="number" 
              className="w-24 p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
              name="family_size" 
              value={formData.family_size} 
              onChange={handleChange} 
              min="1" 
              disabled={isFormLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
            <select 
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
              name="zone" 
              value={formData.zone} 
              onChange={handleChange}
              disabled={isFormLocked}
            >
              <option value="North Caloocan">North Caloocan</option>
              <option value="South Caloocan">South Caloocan</option>
            </select>
          </div>
          <div className="pt-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="termsAgree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={isFormLocked}
                />
                <label htmlFor="termsAgree" className="ml-2 block text-sm text-gray-700">
                  I have read and agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-green-600 hover:text-green-800 hover:underline focus:outline-none disabled:text-gray-400 disabled:cursor-not-allowed" disabled={isFormLocked}>Terms and Conditions</button>
                </label>
              </div>
            </div>

            {/* Terms Modal */}
            {showTermsModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                  <div className="p-6 overflow-y-auto">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Terms and Conditions</h2>
                    <div className="space-y-3">
                      {termsOfAgreement.map((term, index) => (
                        <div key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700">{term}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button 
            type="submit"
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            disabled={isSubmitting || (formData.contact_number && formData.contact_number.length !== 11) || !agreed || isFormLocked}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Relief Request Submitted!
                </h3>
                <p className="text-sm text-gray-600">
                  Your application has been received successfully.
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Thank you for submitting your relief request. Your application is now being processed. You will be contacted through your provided contact number for updates regarding your application status.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  // Navigate to homepage after closing modal
                  navigate('/homepage');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Got it, Thank you!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReliefFormPage;