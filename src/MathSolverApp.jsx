import React, { useState, useEffect, useRef } from 'react';
// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Global variables and Firebase Configuration.
 * NOTE: The logic for calling the Gemini API has been moved to a simulated 
 * Cloud Function endpoint (CLOUD_FUNCTION_URL) to protect the API Key and 
 * enforce authentication via Firebase ID Tokens.
 */
// START: USER PROVIDED CONFIGURATION
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBhwFzOYOOdS3dEO2EN7sRrrk6xcDoIiI4",
  authDomain: "multi-language-math-solv-82224.firebaseapp.com",
  projectId: "multi-language-math-solv-82224",
  storageBucket: "multi-language-math-solv-82224.firebasestorage.app",
  messagingSenderId: "976821902003",
  appId: "1:976821902003:web:13469b2ed40d4ea970aec6",
  measurementId: "G-N7GQBEQCN9"
};
// END: USER PROVIDED CONFIGURATION

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Cloud Function Endpoint (Simulated Path)
const CLOUD_FUNCTION_URL = '/api/math-solver';

// Marker for model response failure when input is unclear
// This marker must be returned by the Cloud Function if the math problem is unclear.
const UNCLARITY_MARKER = "[UNCLEAR_MATH_INPUT]";

// Simulation Durations
const SOLVE_DURATION_MS = 3000; 
const EXPLAIN_DURATION_MS = 5000; 

// Initialize Firebase (outside component to prevent re-initialization)
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app); // Initialized Firestore (for completeness)


// UPDATED: 100+ Supported Languages List - Added local names in parentheses for better clarity.
const LANGUAGE_OPTIONS = [
    { code: 'Auto-Detect', name: 'Auto-Detect' },
    { code: 'English', name: 'English' },
    { code: 'Afrikaans', name: 'Afrikaans' },
    { code: 'Albanian', name: 'Albanian' },
    { code: 'Amharic', name: 'Amharic' },
    { code: 'Arabic', name: 'Arabic (العربية)' },
    { code: 'Armenian', name: 'Armenian' },
    { code: 'Assamese', name: 'Assamese' },
    { code: 'Aymara', name: 'Aymara' },
    { code: 'Azerbaijani', name: 'Azerbaijani' },
    { code: 'Bambara', name: 'Bambara' },
    { code: 'Basque', name: 'Basque' },
    { code: 'Belarusian', name: 'Belarusian' },
    { code: 'Bengali', name: 'Bengali (Bangla)' },
    { code: 'Bhojpuri', name: 'Bhojpuri' },
    { code: 'Bosnian', name: 'Bosnian' },
    { code: 'Bulgarian', name: 'Bulgarian' },
    { code: 'Burmese', name: 'Burmese' },
    { code: 'Catalan', name: 'Catalan' },
    { code: 'Cebuano', name: 'Cebuano' },
    { code: 'Chichewa', name: 'Chichewa' },
    { code: 'Chinese (Simplified)', name: 'Chinese (Simplified) (简体中文)' },
    { code: 'Chinese (Traditional)', name: 'Chinese (Traditional) (繁體中文)' },
    { code: 'Corsican', name: 'Corsican' },
    { code: 'Croatian', name: 'Croatian' },
    { code: 'Czech', name: 'Czech' },
    { code: 'Danish', name: 'Danish' },
    { code: 'Dhivehi', name: 'Dhivehi' },
    { code: 'Dogri', name: 'Dogri' },
    { code: 'Dutch', name: 'Dutch (Nederlands)' },
    { code: 'Esperanto', name: 'Esperanto' },
    { code: 'Estonian', name: 'Estonian' },
    { code: 'Ewe', name: 'Ewe' },
    { code: 'Filipino', name: 'Filipino' },
    { code: 'Finnish', name: 'Finnish' },
    { code: 'French', name: 'French (Français)' },
    { code: 'Frisian', name: 'Frisian' },
    { code: 'Galician', name: 'Galician' },
    { code: 'Georgian', name: 'Georgian' },
    { code: 'German', name: 'German (Deutsch)' },
    { code: 'Greek', name: 'Greek (Ελληνικά)' },
    { code: 'Guarani', name: 'Guarani' },
    { code: 'Gujarati', name: 'Gujarati (ગુજરાતી)' },
    { code: 'Haitian Creole', name: 'Haitian Creole' },
    { code: 'Hausa', name: 'Hausa' },
    { code: 'Hawaiian', name: 'Hawaiian' },
    { code: 'Hebrew', name: 'Hebrew (עברית)' },
    { code: 'Hindi', name: 'Hindi (हिन्दी)' },
    { code: 'Hmong', name: 'Hmong' },
    { code: 'Hungarian', name: 'Hungarian' },
    { code: 'Icelandic', name: 'Icelandic' },
    { code: 'Igbo', name: 'Igbo' },
    { code: 'Indonesian', name: 'Indonesian' },
    { code: 'Irish', name: 'Irish' },
    { code: 'Italian', name: 'Italian (Italiano)' },
    { code: 'Japanese', name: 'Japanese (日本語)' },
    { code: 'Javanese', name: 'Javanese' },
    { code: 'Kannada', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'Kazakh', name: 'Kazakh' },
    { code: 'Khmer', name: 'Khmer' },
    { code: 'Kinyarwanda', name: 'Kinyarwanda' },
    { code: 'Konkani', name: 'Konkani' },
    { code: 'Korean', name: 'Korean (한국어)' },
    { code: 'Krio', name: 'Krio' },
    { code: 'Kurdish', name: 'Kurdish' },
    { code: 'Kyrgyz', name: 'Kyrgyz' },
    { code: 'Lao', name: 'Lao' },
    { code: 'Latin', name: 'Latin' },
    { code: 'Latvian', name: 'Latvian' },
    { code: 'Lingala', name: 'Lingala' },
    { code: 'Lithuanian', name: 'Lithuanian' },
    { code: 'Luganda', name: 'Luganda' },
    { code: 'Luxembourgish', name: 'Luxembourgish' },
    { code: 'Macedonian', name: 'Macedonian' },
    { code: 'Maithili', name: 'Maithili' },
    { code: 'Malagasy', name: 'Malagasy' },
    { code: 'Malay', name: 'Malay' },
    { code: 'Malayalam', name: 'Malayalam (മലയാളം)' },
    { code: 'Maltese', name: 'Maltese' },
    { code: 'Maori', name: 'Maori' },
    { code: 'Marathi', name: 'Marathi (मराठी)' },
    { code: 'Mizo', name: 'Mizo' },
    { code: 'Mongolian', name: 'Mongolian' },
    { code: 'Nepali', name: 'Nepali (नेपाली)' },
    { code: 'Norwegian', name: 'Norwegian' },
    { code: 'Odia', name: 'Odia' },
    { code: 'Oromo', name: 'Oromo' },
    { code: 'Pashto', name: 'Pashto' },
    { code: 'Persian', name: 'Persian (فارسی)' },
    { code: 'Polish', name: 'Polish (Polski)' },
    { code: 'Portuguese', name: 'Portuguese (Português)' },
    { code: 'Punjabi', name: 'Punjabi (ਪੰਜਾਬੀ)' },
    { code: 'Quechua', name: 'Quechua' },
    { code: 'Romanian', name: 'Romanian (Română)' },
    { code: 'Russian', name: 'Russian (Русский)' },
    { code: 'Samoan', name: 'Samoan' },
    { code: 'Sanskrit', name: 'Sanskrit' },
    { code: 'Scots Gaelic', name: 'Scots Gaelic' },
    { code: 'Sepedi', name: 'Sepedi' },
    { code: 'Serbian', name: 'Serbian' },
    { code: 'Sesotho', name: 'Sesotho' },
    { code: 'Shona', name: 'Shona' },
    { code: 'Sindhi', name: 'Sindhi' },
    { code: 'Sinhala', name: 'Sinhala' },
    { code: 'Slovak', name: 'Slovak' },
    { code: 'Slovenian', name: 'Slovenian' },
    { code: 'Somali', name: 'Somali' },
    { code: 'Spanish', name: 'Spanish (Español)' },
    { code: 'Sundanese', name: 'Sundanese' },
    { code: 'Swahili', name: 'Swahili' },
    { code: 'Swedish', name: 'Swedish (Svenska)' },
    { code: 'Tagalog (Filipino)', name: 'Tagalog (Filipino)' },
    { code: 'Tajik', name: 'Tajik' },
    { code: 'Tamil', name: 'Tamil (தமிழ்)' },
    { code: 'Tatar', name: 'Tatar' },
    { code: 'Telugu', name: 'Telugu (తెలుగు)' },
    { code: 'Thai', name: 'Thai (ไทย)' },
    { code: 'Tibetan', name: 'Tibetan' },
    { code: 'Tigrinya', name: 'Tigrinya' },
    { code: 'Tsonga', name: 'Tsonga' },
    { code: 'Turkish', name: 'Turkish (Türkçe)' },
    { code: 'Turkmen', name: 'Turkmen' },
    { code: 'Twi', name: 'Twi' },
    { code: 'Ukrainian', name: 'Ukrainian (Українська)' },
    { code: 'Urdu', name: 'Urdu (اردو)' },
    { code: 'Uyghur', name: 'Uyghur' },
    { code: 'Uzbek', name: 'Uzbek' },
    { code: 'Vietnamese', name: 'Vietnamese (Tiếng Việt)' },
    { code: 'Welsh', name: 'Welsh' },
    { code: 'Xhosa', name: 'Xhosa' },
    { code: 'Yiddish', name: 'Yiddish' },
    { code: 'Yoruba', name: 'Yoruba' },
    { code: 'Zulu', name: 'Zulu' },
];

// Utility to convert file to Base64 string
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

/**
 * UPDATED: Utility to handle API calls with exponential backoff and Firebase ID Token authentication.
 * All API calls are now routed to a single secured Cloud Function endpoint.
 */
const fetchAuthenticated = async (path, payload, user, maxRetries = 3) => {
    if (!user || !user.getIdToken) {
        throw new Error("Authentication failed. User session is invalid.");
    }

    // Get the current user's ID Token to send in the Authorization header
    const token = await user.getIdToken();
    const url = path; 
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // MANDATORY: Send the ID Token for backend verification
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                // Handle common auth failure or server errors
                if (response.status === 401 || response.status === 403) {
                     throw new Error(`Authentication failed. Status: ${response.status}. Please log in again.`);
                }
                throw new Error(`Server Error: ${response.status}. ${errorBody}`);
            }
            return response;
        } catch (error) {
            if (i < maxRetries - 1) {
                const delay = Math.pow(1.5, i) * 500 + Math.random() * 500; 
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw new Error("Request failed after multiple retries. Please check your network and try again.");
            }
        }
    }
};

// Custom Hook to manage File Preview URL (Logic remains the same)
const useFilePreview = (file) => {
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!file || !file.type.startsWith('image/')) {
            setPreviewUrl(null);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);

        return () => {
            setPreviewUrl(null);
        };
    }, [file]);

    return previewUrl;
};

// --- Authentication Component (Logic remains the same) ---
const AuthModal = ({ show, onClose, authError, setAuthError }) => {
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setAuthError(null);
    }, [authMode, setAuthError]);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setAuthError(null);
        setIsSubmitting(true);

        try {
            if (authMode === 'signup') {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName });
                onClose();
            } else { // login
                await signInWithEmailAndPassword(auth, email, password);
                onClose();
            }
        } catch (e) {
            let errorMsg = "Authentication failed. Please check your credentials.";
            if (e.code === 'auth/email-already-in-use') {
                errorMsg = "This email is already registered. Please log in.";
            } else if (e.code === 'auth/weak-password') {
                errorMsg = "Password should be at least 6 characters.";
            } else if (e.code === 'auth/invalid-email') {
                errorMsg = "Invalid email format.";
            } else if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
                errorMsg = "Invalid email or password.";
            }
            setAuthError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-transform duration-300 scale-100 border border-indigo-200">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h3 className="text-2xl font-bold text-indigo-700">
                        {authMode === 'login' ? 'Log In' : 'Sign Up'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition p-1 rounded-full hover:bg-gray-100">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <form onSubmit={handleAuthAction} className="space-y-4">
                    {authMode === 'signup' && (
                        <input
                            type="text"
                            placeholder="Display Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    />
                    <input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    />

                    {authError && (
                        <p className="text-red-600 text-sm bg-red-100 p-2 rounded-lg border border-red-300">{authError}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 transition duration-200 disabled:opacity-50 shadow-lg"
                    >
                        {isSubmitting ? (
                            <svg className="animate-spin h-5 w-5 mr-3 inline text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            authMode === 'login' ? 'Log In' : 'Sign Up'
                        )}
                    </button>
                </form>
                
                <div className="mt-4 text-center text-sm">
                    <button
                        onClick={() => {
                            setAuthMode(authMode === 'login' ? 'signup' : 'login');
                            setAuthError(null);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-medium transition"
                    >
                        {authMode === 'login' ? "Need an account? Sign Up" : "Already have an account? Log In"}
                    </button>
                </div>
            </div>
        </div>
    );
};
// --- End Authentication Component ---


const App = () => {
    const [mathProblem, setMathProblem] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [outputLanguage, setOutputLanguage] = useState('English');
    const [hasInteractedWithLanguage, setHasInteractedWithLanguage] = useState(false); 
    const [solutionText, setSolutionText] = useState(null);
    const [easierExplanationText, setEasierExplanationText] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExplaining, setIsExplaining] = useState(false);
    const [error, setError] = useState(null);
    
    // Auth State
    const [userId, setUserId] = useState(null);
    const [displayName, setDisplayName] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authError, setAuthError] = useState(null);

    const [fileWarning, setFileWarning] = useState(null); 
    const [progress, setProgress] = useState(0); 
    const [progressStatus, setProgressStatus] = useState("Ready to start."); 
    const [apiCallPromise, setApiCallPromise] = useState(null); 
    
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    
    const imagePreviewUrl = useFilePreview(selectedFile);

    // Custom CSS for glow effect and scrollbar
    const customStyles = `
        @keyframes pulse-glow-language-prompt {
            0%, 100% {
                box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.4), 0 0 10px rgba(99, 102, 241, 0.6);
            }
            50% {
                box-shadow: 0 0 0 8px rgba(129, 140, 248, 0.6), 0 0 16px rgba(129, 140, 248, 0.9);
            }
        }
        .language-glow-prompt {
            animation: pulse-glow-language-prompt 2.5s infinite ease-in-out;
        }
        .scroll-container {
            max-height: 250px;
            overflow-y: auto;
            border-radius: 0.75rem;
            padding: 1rem;
        }
        .scroll-container::-webkit-scrollbar {
            width: 8px;
        }
        .scroll-container::-webkit-scrollbar-thumb {
            background-color: #A5B4FC;
            border-radius: 4px;
        }
    `;

    // 1. Firebase Authentication Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                setDisplayName(user.displayName);
            } else {
                setUserId(null);
                setDisplayName(null);
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);
    
    // Auth related functions
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // State will be updated by onAuthStateChanged listener
            setShowAuthModal(false);
        } catch (e) {
            console.error("Sign out error:", e);
            setAuthError("Failed to sign out.");
        }
    };


    // 2. Progress Logic during processing
    useEffect(() => {
        let intervalId;
        const totalDuration = isLoading ? SOLVE_DURATION_MS : EXPLAIN_DURATION_MS;

        const updateInterval = 50; 
        const maxSimulatedProgress = 99; 
        const increment = (maxSimulatedProgress / (totalDuration / updateInterval)); 

        if (isLoading || isExplaining) {
            setProgress(1); 
            
            intervalId = setInterval(() => {
                setProgress(prev => {
                    if (apiCallPromise === null) {
                        return prev; 
                    }

                    const newProgress = prev + increment;
                    
                    if (newProgress < maxSimulatedProgress) {
                        const currentPercentage = Math.floor(newProgress);
                        
                        if (currentPercentage < 35) {
                             setProgressStatus(`Analyzing input... (${currentPercentage}%)`);
                        } else if (currentPercentage < 75) {
                             setProgressStatus(`Processing core solution... (${currentPercentage}%)`);
                        } else {
                             setProgressStatus(`${isLoading ? 'Finalizing solution' : 'Generating simplified explanation'}... (${currentPercentage}%)`);
                        }
                        return newProgress;
                    }
                    
                    clearInterval(intervalId);
                    setProgressStatus(`Finalizing response... (99%)`);
                    return maxSimulatedProgress; 
                });
            }, updateInterval);
        } else {
            setProgress(0);
            setProgressStatus("Ready to start.");
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isLoading, isExplaining, apiCallPromise]); 

    // Function: Handle Core Solution Request via Cloud Function
    const solveMathProblem = async () => {
        const user = auth.currentUser;
        if (!user) {
            setError("Please log in or sign up to solve a problem.");
            setShowAuthModal(true);
            return;
        }
        
        if (!mathProblem && !selectedFile) {
            setError("Please enter the problem or upload an image/PDF."); 
            return;
        }

        setHasInteractedWithLanguage(true); 
        setError(null);
        setSolutionText(null);
        setEasierExplanationText(null);
        setIsLoading(true);
        setFileWarning(null); 
        setApiCallPromise(null); 

        try {
            const base64Image = await fileToBase64(selectedFile);

            // 1. Prepare payload for the secured Cloud Function
            const payload = {
                action: 'solve', // Cloud Function determines if it's a solve request
                textProblem: mathProblem,
                base64Image: base64Image,
                mimeType: selectedFile ? selectedFile.type : null,
                outputLanguage: outputLanguage,
            };

            // 2. Call the secured Cloud Function
            const apiPromise = fetchAuthenticated(
                CLOUD_FUNCTION_URL, 
                payload, 
                user // Pass the user object to get the ID token inside the fetch utility
            );
            setApiCallPromise(apiPromise); 

            const response = await apiPromise;
            setApiCallPromise(null); 

            // 3. Process Cloud Function response
            const result = await response.json();
            // We expect the Cloud Function to return the solution in a 'solution' field
            const text = result.solution; 

            if (text && typeof text === 'string' && text.includes(UNCLARITY_MARKER)) {
                setError("The model could not identify a clear mathematical problem in the input. Please upload a clearer question or type out the problem."); 
                setSolutionText(null); 
            } else if (text) {
                setSolutionText(text);
            } else {
                setError("Could not generate solution. No response was received from the server."); 
            }

        } catch (e) {
            console.error("Math solution error:", e);
            setError(e.message || "An unknown error occurred."); 
        } finally {
            setProgress(100); 
            setProgressStatus("Complete (100%)."); 
            setTimeout(() => setIsLoading(false), 100); 
            setApiCallPromise(null); 
        }
    };

    // Function: Generate Simplified Explanation Request via Cloud Function
    const getEasierExplanation = async () => {
        const user = auth.currentUser;
        if (!user) {
            setError("Please log in or sign up to get an explanation.");
            setShowAuthModal(true);
            return;
        }
        
        if (!solutionText) {
            setError("Please solve the problem first."); 
            return;
        }

        setHasInteractedWithLanguage(true); 
        setError(null);
        setEasierExplanationText(null);
        setIsExplaining(true);
        setFileWarning(null);
        setApiCallPromise(null); 

        try {
            const isAuto = outputLanguage === 'Auto-Detect';
            const targetLanguage = isAuto ? 'English' : outputLanguage; 
            
            // 1. Prepare payload for the secured Cloud Function
            // Send the problem and the initial solution for the backend to simplify
            const payload = {
                action: 'explain', // Cloud Function determines if it's an explain request
                originalProblem: mathProblem || "Problem previously submitted via image/document.",
                originalSolution: solutionText,
                outputLanguage: targetLanguage,
            };

            // 2. Call the secured Cloud Function
            const apiPromise = fetchAuthenticated(
                CLOUD_FUNCTION_URL, 
                payload, 
                user 
            );
            setApiCallPromise(apiPromise); 

            const response = await apiPromise;
            setApiCallPromise(null); 

            // 3. Process Cloud Function response
            const result = await response.json();
            // We expect the Cloud Function to return the explanation in an 'explanation' field
            const text = result.explanation; 

            if (text) {
                setEasierExplanationText(text);
            } else {
                setError("Could not generate an easier explanation."); 
            }

        } catch (e) {
            console.error("Easier explanation error:", e);
            setError(e.message || "An unknown error occurred while generating the easier explanation."); 
        } finally {
            setProgress(100); 
            setProgressStatus("Complete (100%)."); 
            setTimeout(() => setIsExplaining(false), 100);
            setApiCallPromise(null); 
        }
    };


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFileWarning(null);
        
        if (file) {
            const isImage = file.type.startsWith('image/');
            const isPdf = file.type === 'application/pdf';

            if (!isImage && !isPdf) {
                setError("Please upload a valid image file (.jpg, .png, etc.) or a PDF document."); 
                setSelectedFile(null);
                e.target.value = null; 
                return;
            }
            
            setSelectedFile(file);
            setError(null);
            e.target.value = null; 

            if (isPdf) {
                setFileWarning("A PDF file has been selected. Remember this app is primarily optimized for image data analysis. For best results, please convert the PDF page to an image (.jpg/.png) and upload it."); 
            }
            
            setHasInteractedWithLanguage(true); 

        }
    };

    // Handle language selection change
    const handleLanguageChange = (e) => {
        setOutputLanguage(e.target.value);
        setHasInteractedWithLanguage(true); 
    };

    // Handle language focus (to remove glow on interaction)
    const handleLanguageFocus = () => {
        setHasInteractedWithLanguage(true);
    };

    const handleButtonClick = (type) => {
        if (!userId) {
             setError("Please log in or sign up to upload files.");
             setShowAuthModal(true);
             return;
        }

        if (type === 'upload' && fileInputRef.current) {
            fileInputRef.current.click();
        } else if (type === 'camera' && cameraInputRef.current) {
            cameraInputRef.current.click();
        }
        setHasInteractedWithLanguage(true);
    };

    const isProcessing = isLoading || isExplaining;
    
    const shouldGlow = !hasInteractedWithLanguage;
    const glowClass = shouldGlow ? 'language-glow-prompt' : '';
    const showSubmittedProblem = mathProblem || selectedFile;


    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4 sm:p-8 font-sans">
            <style>{customStyles}</style>
            
            {/* Authentication Modal */}
            <AuthModal 
                show={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                authError={authError}
                setAuthError={setAuthError}
            />

            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-indigo-800 mb-2 drop-shadow-md">AI Math Solver</h1> 
                    <p className="text-xl text-gray-600">Solve complex math problems in your preferred, easy-to-understand way.</p> 
                    
                    {/* Auth Status and Button */}
                    <div className="mt-4 flex justify-center items-center space-x-4">
                        {isAuthReady ? (
                            userId ? (
                                <>
                                    <p className="text-base text-gray-700 font-medium bg-white px-4 py-2 rounded-full shadow-md border border-green-300">
                                        Welcome, {displayName || 'Authenticated User'}!
                                    </p>
                                    <button 
                                        onClick={handleSignOut} 
                                        className="text-sm text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full transition duration-200 shadow-md"
                                        disabled={isProcessing}
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => setShowAuthModal(true)} 
                                    className="text-base text-white bg-green-500 hover:bg-green-600 px-6 py-2 rounded-xl transition duration-200 shadow-lg"
                                    disabled={isProcessing}
                                >
                                    Log In / Sign Up to Start
                                </button>
                            )
                        ) : (
                            <p className="text-base text-gray-500">Authentication loading...</p>
                        )}
                    </div>

                </header>

                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-indigo-200/50">
                    <div className="space-y-6">
                        
                        {/* Language Selector */}
                        <div className={`p-4 bg-indigo-50 rounded-2xl shadow-lg shadow-indigo-200/50 border border-indigo-300 transition duration-300 ${glowClass}`}>
                            <label htmlFor="language-select" className="block text-lg font-medium text-gray-800 mb-2">
                                1. Select Your Preferred Solution Language
                            </label> 
                            <div className="relative">
                                <select
                                    id="language-select"
                                    value={outputLanguage}
                                    onChange={handleLanguageChange}
                                    onFocus={handleLanguageFocus}
                                    onMouseDown={handleLanguageFocus}
                                    disabled={isProcessing}
                                    className="block w-full py-3 px-4 pr-10 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 appearance-none cursor-pointer text-gray-700"
                                >
                                    {/* The name property in LANGUAGE_OPTIONS includes the local name */}
                                    {LANGUAGE_OPTIONS.map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                </div>
                            </div>
                        </div>

                        {/* Text Input Area */}
                        <div>
                            <label htmlFor="math-problem" className="block text-lg font-medium text-gray-800 mb-2">
                                2. Type Your Problem (Optional)
                            </label> 
                            <textarea
                                id="math-problem"
                                rows="3"
                                className="w-full p-4 border-2 border-indigo-300/50 rounded-xl focus:ring-purple-500 focus:border-purple-500 transition duration-150 shadow-inner resize-none"
                                placeholder="Enter your equation, problem statement, or expression here..." 
                                value={mathProblem}
                                onChange={(e) => {
                                    setMathProblem(e.target.value);
                                    setHasInteractedWithLanguage(true);
                                    setError(null);
                                }}
                                disabled={isProcessing || !userId}
                            ></textarea>
                            {!userId && <p className="text-sm text-red-500 mt-1">Please log in to enable text input.</p>}
                        </div>

                        {/* File Upload/Camera Scan Buttons */}
                        <div className="pt-4 border-t border-gray-100">
                            <label className="block text-lg font-medium text-gray-800 mb-3">
                                3. Or Upload/Scan an Image/PDF (Optional)
                            </label> 
                            <div className="flex space-x-4">
                                {/* Hidden file input for regular upload */}
                                <input
                                    type="file"
                                    accept="image/*, application/pdf"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                    disabled={isProcessing || !userId}
                                />
                                {/* Hidden file input for camera scan */}
                                <input
                                    type="file"
                                    accept="image/*, application/pdf"
                                    capture="camera"
                                    ref={cameraInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                    disabled={isProcessing || !userId}
                                />
                                
                                {/* Upload Button */}
                                <button
                                    onClick={() => handleButtonClick('upload')}
                                    disabled={isProcessing || !userId}
                                    className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-xl text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                    Upload Image / PDF
                                </button> 

                                {/* Camera Scan Button */}
                                <button
                                    onClick={() => handleButtonClick('camera')}
                                    disabled={isProcessing || !userId}
                                    className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-xl text-purple-700 bg-purple-100 hover:bg-purple-200 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.828-1.242a2 2 0 011.664-.89h.84c.732 0 1.344.475 1.575 1.129l1.458 4.093c.123.344.385.606.729.729l4.093 1.458c.654.231 1.129.843 1.129 1.575v.84a2 2 0 01-.89 1.664l-1.242.828a2 2 0 00-.89 1.664v.93a2 2 0 01-2 2H5a2 2 0 01-2-2v-12z"></path></svg>
                                    Scan with Camera
                                </button> 
                            </div>
                            
                            {selectedFile && (
                                <p className="mt-3 text-sm text-green-700 font-medium bg-green-50 p-2 rounded-lg border border-green-300 flex justify-between items-center">
                                    <span>Selected File: {selectedFile.name} ({selectedFile.type})</span> 
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        className="text-red-600 hover:text-red-800 font-bold ml-4 p-1 rounded-full hover:bg-white/50 transition"
                                        title="Remove" 
                                    >
                                        &times;
                                    </button>
                                </p>
                            )}
                            {/* PDF Warning Display */}
                            {fileWarning && (
                                <div className="mt-3 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-xl text-sm" role="alert">
                                    <strong className="font-bold">Warning:</strong> 
                                    <span className="block sm:inline ml-1">{fileWarning}</span> 
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
                                <strong className="font-bold">Error!</strong> 
                                <span className="block sm:inline ml-2">{error}</span> 
                            </div>
                        )}

                        {/* Progress Status Message and Bar */}
                        {isProcessing && (
                             <div className="mt-4">
                                <p className="text-sm font-semibold text-purple-600 mb-2">
                                    {progressStatus} 
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="h-2.5 rounded-full bg-indigo-500 transition-all duration-300 ease-out" 
                                        style={{ width: `${progress}%` }}
                                        >
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Solve Button */}
                        <button
                            onClick={solveMathProblem}
                            disabled={isProcessing || !userId || (!mathProblem && !selectedFile)}
                            className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-indigo-400/50 hover:shadow-indigo-500/70"
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isExplaining ? "Generating Explanation..." : "Generating Solution..."} 
                                </>
                            ) : (
                                "4. Solve the Problem"
                            )} 
                        </button>
                    </div>
                </div>

                {/* --- Submitted Problem Display --- */}
                {showSubmittedProblem && (
                    <div className="mt-8 p-6 sm:p-8 bg-white rounded-2xl shadow-2xl border border-indigo-200">
                        <h2 className="text-2xl font-extrabold text-gray-800 mb-4 border-b pb-2">Your Submitted Problem:</h2> 
                        
                        {/* Display Text Problem */}
                        {mathProblem && (
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-indigo-600 mb-2">Text Input:</h3> 
                                <div className="scroll-container bg-gray-50 border border-gray-300 text-gray-700 font-mono text-sm">
                                    {mathProblem}
                                </div>
                            </div>
                        )}

                        {/* Display File Problem (Image/PDF) */}
                        {selectedFile && (
                            <div>
                                <h3 className="text-lg font-semibold text-indigo-600 mb-2">File Input:</h3> 
                                <p className="text-sm text-gray-700 mb-3">
                                    **File Name:** {selectedFile.name} | **Type:** {selectedFile.type} 
                                </p>
                                
                                {/* Image Preview for image files */}
                                {imagePreviewUrl && (
                                    <div className="mt-3 border-4 border-indigo-400/50 rounded-xl overflow-hidden shadow-xl max-w-full h-auto">
                                        <img 
                                            src={imagePreviewUrl} 
                                            alt="Problem Preview" 
                                            className="w-full h-auto object-contain max-h-[300px]"
                                        />
                                    </div>
                                )}
                                
                                {/* Placeholder for PDF files */}
                                {selectedFile.type === 'application/pdf' && !imagePreviewUrl && (
                                    <div className="mt-3 p-4 bg-yellow-50 border border-yellow-300 rounded-xl text-yellow-800 flex items-center">
                                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        <p>PDF file uploaded. A preview is unavailable here, but the model is processing the document.</p> 
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {/* --- End Submitted Problem Display --- */}
                
                {/* Easier Explanation Button */}
                {solutionText && !isExplaining && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={getEasierExplanation}
                            disabled={isProcessing}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-green-500 hover:bg-green-600 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"></path></svg>
                            Get an Easier Explanation (Optional)
                        </button> 
                    </div>
                )}

                {/* Easier Explanation Display Area */}
                {easierExplanationText && (
                    <div className="mt-8 p-6 sm:p-8 bg-green-50 rounded-2xl shadow-2xl border-t-4 border-green-500">
                        <h2 className="text-2xl font-extrabold text-green-700 mb-4 border-b pb-2">Simplified Explanation:</h2> 
                        <div
                            className="prose max-w-none text-gray-800 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: easierExplanationText }}
                        ></div>
                    </div>
                )}
                
                {/* Solution Display Area (Primary Answer) */}
                {solutionText && (
                    <div className={`mt-8 p-6 sm:p-8 bg-white rounded-2xl shadow-2xl border-t-4 border-indigo-500 ${easierExplanationText ? 'mt-4' : ''}`}>
                        <h2 className="text-2xl font-extrabold text-indigo-700 mb-4 border-b pb-2">Step-by-Step Solution:</h2> 
                        <div
                            className="prose max-w-none text-gray-800 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: solutionText }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
