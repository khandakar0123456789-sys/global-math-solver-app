// Import necessary libraries
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { VertexAI } = require('@google-cloud/vertexai');

// --- Initialization ---

// Initialize Firebase Admin SDK (required for token verification and auth)
admin.initializeApp();

// Initialize VertexAI client
// Vertex AI will automatically use the credentials of the Cloud Function environment.
const PROJECT_ID = process.env.GCLOUD_PROJECT;
// NOTE: Please change the region to your desired deployment region (e.g., 'asia-south1' for India)
const REGION = 'us-central1'; 

if (!PROJECT_ID) {
    console.error("GCLOUD_PROJECT environment variable not set.");
}

const vertex_ai = new VertexAI({ 
    project: PROJECT_ID, 
    location: REGION 
});

const MODEL_NAME = 'gemini-2.5-flash';
// Marker must match the one in the React app
const UNCLARITY_MARKER = "[UNCLEAR_MATH_INPUT]";

// --- Utility Functions ---

/**
 * Converts a base64 string to a Google Generative AI Part object.
 * @param {string} mimeType The MIME type of the data (e.g., 'image/png', 'application/pdf').
 * @param {string} base64Data The base64 encoded string of the file.
 * @returns {object} A Part object for the Gemini API.
 */
function fileToGenerativePart(mimeType, base64Data) {
    if (!base64Data) return null;
    return {
        inlineData: {
            data: base64Data,
            mimeType,
        },
    };
}

/**
 * Ensures the request is authenticated with a valid Firebase ID Token from the Authorization header.
 * @param {object} req - Express request object.
 * @returns {Promise<object|null>} The decoded ID Token payload or null on failure.
 */
async function authenticateRequest(req) {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return null;
    }

    const token = authorization.split('Bearer ')[1];
    
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        // Log token verification failures
        console.error('Error verifying ID token:', error.message);
        return null;
    }
}

// --- Main HTTP Cloud Function ---

/**
 * Secured HTTP function to handle math problem solving and explanation via Gemini.
 * Maps to the endpoint: /api/math-solver
 */
exports.mathSolver = functions.https.onRequest(async (req, res) => {
    // 1. CORS Setup (Essential for client-side JavaScript calls)
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    // Handle CORS pre-flight requests
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Authentication Check
    const authResult = await authenticateRequest(req);
    if (!authResult) {
        // Returns 401 if token is missing or invalid
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing authentication token.' });
    }
    
    // Auth successful. Extract body data.
    const { action, textProblem, base64Image, mimeType, outputLanguage, originalProblem, originalSolution } = req.body;
    
    if (!action) {
        return res.status(400).json({ error: 'Missing required field: action (solve or explain).' });
    }

    try {
        let systemInstruction = '';
        let userPrompt = '';
        let modelResponse;

        // --- Action: SOLVE (Problem Solving) ---
        if (action === 'solve') {
            if (!textProblem && !base64Image) {
                 return res.status(400).json({ error: 'Missing math problem text or image data.' });
            }

            systemInstruction = `You are a world-class, professional mathematics tutor. Your task is to accurately solve the user's math problem and provide a detailed, step-by-step solution.`;
            
            const promptParts = [];
            
            if (textProblem && textProblem.trim()) {
                userPrompt = `Solve the following math problem step-by-step. Provide the final answer clearly. Translate the entire solution and explanation into the following language: ${outputLanguage}.\n\nProblem: ${textProblem}`;
            } else if (base64Image) {
                userPrompt = `Solve the math problem shown in the image step-by-step. Provide the final answer clearly. Translate the entire solution and explanation into the following language: ${outputLanguage}. If the image does not contain a clear mathematical problem, return ONLY the text: ${UNCLARITY_MARKER}`;
            }

            promptParts.push({ text: userPrompt });

            // Add image part if present
            if (base64Image && mimeType) {
                const imagePart = fileToGenerativePart(mimeType, base64Image);
                if (imagePart) {
                    promptParts.push(imagePart);
                }
            }

            // Call Gemini
            modelResponse = await vertex_ai.generateContent({
                model: MODEL_NAME,
                contents: [{ role: 'user', parts: promptParts }],
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.2, 
                }
            });

            const solutionText = modelResponse.text.trim();
            
            return res.status(200).json({ solution: solutionText });
        }

        // --- Action: EXPLAIN (Simplified Explanation) ---
        else if (action === 'explain') {
            if (!originalSolution) {
                 return res.status(400).json({ error: 'Missing original solution to explain.' });
            }
            
            systemInstruction = `You are an expert tutor. Your task is to simplify and re-explain a previously solved math problem. Use simpler language, analogies, and focus on the core concept. Do not just repeat the steps.`;
            
            userPrompt = `The original problem was: "${originalProblem}". The detailed solution is: "${originalSolution}".\n\nBased on the detailed solution, provide a simpler, easier-to-understand explanation focusing on the main concepts used. Ensure the explanation is fully translated into the language: ${outputLanguage}.`;

            // Call Gemini
            modelResponse = await vertex_ai.generateContent({
                model: MODEL_NAME,
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.5, 
                }
            });

            const explanationText = modelResponse.text.trim();

            return res.status(200).json({ explanation: explanationText });
        }

        // --- Unknown Action ---
        else {
            return res.status(400).json({ error: `Invalid action specified: ${action}` });
        }

    } catch (error) {
        console.error("Gemini or function execution error:", error);
        // Respond with a generic server error
        return res.status(500).json({ 
            error: 'Internal Server Error during AI processing.', 
            details: error.message 
        });
    }
});
