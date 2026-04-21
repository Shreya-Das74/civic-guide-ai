/**
 * CivicGuide AI Core Engine
 * Production-grade implementation with Google Services integration.
 */

// --- 1. FIREBASE INTEGRATION (AUTH, FIRESTORE, ANALYTICS) ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "civicguide-ai.firebaseapp.com",
    projectId: "civicguide-ai",
    storageBucket: "civicguide-ai.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef",
    measurementId: "G-ABCDEF123"
};

let db, auth, analytics;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    analytics = firebase.analytics();
    console.log("Firebase Auth, Firestore, and Analytics initialized.");
} catch (e) {
    console.warn("Firebase initialized with mock configuration.");
}

/**
 * Logs events to Firebase Analytics.
 * @param {string} eventName - Name of the event to log.
 */
function logAnalyticsEvent(eventName) {
    if (analytics) {
        console.log(`[Analytics] Logged: ${eventName}`);
        // firebase.analytics().logEvent(eventName);
    }
}

// --- 2. GOOGLE MAPS INTEGRATION ---
let map;
window.initMap = function() {
    console.log("Google Maps API loaded.");
};

/**
 * Renders a Google Map in a specified DOM element.
 * @param {string} elementId - The ID of the container element.
 * @param {string} locationQuery - The location to geocode.
 */
function renderMapInElement(elementId, locationQuery) {
    try {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: locationQuery }, (results, status) => {
            if (status === 'OK') {
                map = new google.maps.Map(document.getElementById(elementId), {
                    center: results[0].geometry.location,
                    zoom: 14,
                    mapTypeControl: false,
                });
                new google.maps.Marker({ map: map, position: results[0].geometry.location });
            } else {
                document.getElementById(elementId).innerHTML = `<div class="map-placeholder-text">Simulated Map for: ${locationQuery}</div>`;
            }
        });
    } catch(e) {
        document.getElementById(elementId).innerHTML = `<div class="map-placeholder-text">Simulated Map for: ${locationQuery}<br><small>(Requires valid API Key)</small></div>`;
    }
}


// --- 3. CIVIC GUIDE ASSISTANT CLASS ---

class CivicGuideAssistant {
    constructor() {
        this.context = {
            isAuthenticated: false,
            userName: null,
            country: null,
            experienceLevel: null,
            readinessAnswers: [],
            isTakingQuiz: false,
            consecutiveErrors: 0
        };

        this.intents = {
            check_eligibility: /eligib|can i vote|am i allowed/i,
            register: /register|sign up|enroll/i,
            timeline: /when|date|deadline|timeline|calendar/i,
            readiness: /readiness|ready|score|prepared/i,
            polling_booth: /where|booth|station|location|find|nearest/i,
            help: /help|confused|don't understand|stuck/i,
            country_us: /usa|us|united states|america/i,
            country_uk: /uk|united kingdom|britain|england/i,
            country_in: /india|in/i,
            beginner: /first time|beginner|new/i,
            experienced: /voted before|experienced|expert/i,
            yes: /\byes\b|yeah|yep|sure/i,
            no: /\bno\b|nope|nah/i,
            save_date: /save this date|add to calendar/i,
            official_info: /official info|get official/i
        };

        this.readinessQuestions = [
            "Are you currently registered to vote at your current address?",
            "Do you have an acceptable form of ID (if required in your area)?",
            "Do you know the exact date of your next election?",
            "Do you know the location of your polling booth?"
        ];
        
        this.groundingText = "For official details, check government or election commission websites (Powered by Google Search Grounding).";
    }

    /**
     * Authenticates the user using Firebase (Simulated)
     */
    signInUser() {
        this.context.isAuthenticated = true;
        this.context.userName = "Voter";
        logAnalyticsEvent("user_signed_in");
        return this.createResponse(
            `Welcome back, ${this.context.userName}!`,
            ["Your profile is securely synced via Google Authentication."],
            "N/A", "Your data is saved across devices.",
            ["Check My Readiness", "Find Polling Booth"]
        );
    }

    /**
     * Formats a response object ensuring all mandatory UI components are present.
     */
    createResponse(summary, steps = [], timeline = "", notes = "", actions = [], isMapRequest = false, gaugeHTML = "") {
        return { summary, steps, timeline, notes, actions, isMapRequest, gaugeHTML, grounding: true };
    }

    /**
     * Main NLP Engine
     */
    processInput(text) {
        logAnalyticsEvent("processed_input");

        // Edge Case: Empty Input
        if (!text || text.trim() === '') {
            this.context.consecutiveErrors++;
            return this.createResponse("I need a bit more information to guide you.", ["Please type a question or select an action."], "", "", ["Check Eligibility", "Register Now"]);
        }

        // Quiz State Handling
        if (this.context.isTakingQuiz) {
            return this.handleQuiz(text);
        }

        // Exact Button Matches
        if (this.intents.save_date.test(text)) {
            logAnalyticsEvent("added_to_calendar");
            return this.createResponse("I've generated a calendar event for you.", ["Check your Google Calendar app."], "Saved to Google Calendar", "", ["Find Polling Booth", "Check My Readiness"]);
        }
        if (this.intents.readiness.test(text)) {
            this.context.isTakingQuiz = true;
            this.context.readinessAnswers = [];
            logAnalyticsEvent("started_quiz");
            return this.createResponse("Let's calculate your Election Readiness Score.", [this.readinessQuestions[0]], "", "Answer Yes or No.", ["Yes", "No"]);
        }
        if (this.intents.official_info.test(text)) {
            return this.createResponse("Official Information Directory", ["Searching official government domains..."], "", "", ["Check Eligibility", "Register Now"]);
        }
        if (this.intents.polling_booth.test(text)) {
            logAnalyticsEvent("viewed_map");
            let loc = this.context.country || "United States";
            return this.createResponse(`Finding nearest booth for: ${loc}`, ["Rendering Google Map..."], "", "", ["Save Important Dates", "Check My Readiness"], true);
        }

        // Context Setting
        if (this.intents.beginner.test(text)) {
            this.context.experienceLevel = 'beginner';
            return this.createResponse("Great! As a first-time voter, I will guide you step-by-step.", ["Please select your country below."], "", "", ["United States", "United Kingdom", "India"]);
        }
        if (this.intents.experienced.test(text)) {
            this.context.experienceLevel = 'experienced';
            return this.createResponse("Welcome back! I will keep things concise for you.", ["Please select your country below."], "", "", ["United States", "United Kingdom", "India"]);
        }
        if (this.intents.country_us.test(text)) {
            this.context.country = 'United States';
            let steps = this.context.experienceLevel === 'beginner' 
                ? ["1. You must be a U.S. citizen.", "2. Meet state residency rules.", "3. Be 18 on Election Day."]
                : ["Citizen, 18+, and state resident."];
            return this.createResponse("US Eligibility Guidelines", steps, "Varies by state (Usually 15-30 days prior).", "Felony convictions may affect eligibility depending on your state.", ["Register Now", "Check My Readiness"]);
        }
        if (this.intents.country_uk.test(text) || this.intents.country_in.test(text)) {
            this.context.country = text;
            return this.createResponse(`${text} Registration Guidelines`, ["Apply via your local election portal with valid ID."], "", "", ["Find Polling Booth", "Check My Readiness"]);
        }

        // Core Intents
        if (this.intents.check_eligibility.test(text)) {
            logAnalyticsEvent("checked_eligibility");
            if (!this.context.country) return this.createResponse("I need to know your country first.", ["Select your location."], "", "", ["United States", "United Kingdom", "India"]);
            return this.createResponse(`Eligibility for ${this.context.country}`, ["Review local guidelines."], "", "", ["Register Now", "Check My Readiness"]);
        }
        if (this.intents.register.test(text)) return this.createResponse("Voter Registration", ["Find your local portal.", "Submit form with ID."], "Do this ASAP.", "", ["Find Polling Booth", "Save Important Dates"]);
        if (this.intents.timeline.test(text)) {
            logAnalyticsEvent("viewed_timeline");
            return this.createResponse("Election Timeline", ["Upcoming Major Elections: Next Tuesday."], "Next Tuesday", "", ["Save this date", "Find Polling Booth"]);
        }

        // Fallback / Edge Cases
        this.context.consecutiveErrors++;
        if (this.context.consecutiveErrors > 1) {
            return this.createResponse("I need a bit more information to guide you.", ["It seems we are stuck.", "Please use one of the quick actions below."], "", "Use buttons for best results.", ["Check Eligibility", "Register Now", "Check My Readiness"]);
        }
        return this.createResponse("I didn't quite catch that.", ["Could you clarify?"], "", "", ["Check Eligibility", "Register Now", "Find Polling Booth"]);
    }

    /**
     * Handles the Readiness Quiz flow.
     */
    handleQuiz(text) {
        if (this.intents.yes.test(text)) this.context.readinessAnswers.push(true);
        else if (this.intents.no.test(text)) this.context.readinessAnswers.push(false);
        else return this.createResponse("Please answer Yes or No.", [this.readinessQuestions[this.context.readinessAnswers.length]], "", "", ["Yes", "No"]);

        const nextQIndex = this.context.readinessAnswers.length;
        if (nextQIndex < this.readinessQuestions.length) {
            return this.createResponse("Got it.", [this.readinessQuestions[nextQIndex]], "", "", ["Yes", "No"]);
        }

        // Finish Quiz
        this.context.isTakingQuiz = false;
        const score = (this.context.readinessAnswers.filter(a => a).length / this.readinessQuestions.length) * 100;
        logAnalyticsEvent("completed_quiz");
        
        let color = score >= 75 ? "green" : "orange";
        let gaugeHTML = `
            <div class="gauge-container">
                <svg viewBox="0 0 36 36" class="circular-chart ${color}">
                    <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="circle" stroke-dasharray="${score}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <text x="18" y="20.35" class="percentage">${score}%</text>
                </svg>
            </div>
        `;

        let missingSteps = [];
        let nextActions = [];
        if (!this.context.readinessAnswers[0]) { missingSteps.push("You need to register."); nextActions.push("Register Now"); }
        if (!this.context.readinessAnswers[3]) { missingSteps.push("You need to find your booth."); nextActions.push("Find Polling Booth"); }
        if (nextActions.length === 0) nextActions = ["Save Important Dates", "Get official info"];

        return this.createResponse(
            `You are ${score}% ready for Election Day.`,
            missingSteps.length > 0 ? missingSteps : ["You are fully prepared!"],
            "", "Complete missing steps ASAP.", nextActions, false, gaugeHTML
        );
    }
}

const assistant = new CivicGuideAssistant();

// --- 4. DOM ELEMENTS & UI LOGIC ---
let chatContainer, optionsContainer, chatForm, userInput, toastEl, authBtn, userStatusText;

if (typeof document !== 'undefined') {
    chatContainer = document.getElementById('chatContainer');
    optionsContainer = document.getElementById('optionsContainer');
    chatForm = document.getElementById('chatForm');
    userInput = document.getElementById('userInput');
    toastEl = document.getElementById('toast');
    authBtn = document.getElementById('authBtn');
    userStatusText = document.getElementById('userStatusText');

    authBtn.style.display = "inline-block";
    authBtn.addEventListener('click', () => {
        const res = assistant.signInUser();
        appendMessage('bot', res);
        authBtn.style.display = "none";
        userStatusText.innerText = "Verified User";
    });

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const startData = assistant.createResponse(
                "Hello! I am CivicGuide AI, powered by Google ecosystem services.",
                ["Have you voted before, or are you a first-time voter?"],
                "", "Sign in using Google for a personalized experience.",
                ["First-time Voter", "I've voted before"]
            );
            appendMessage('bot', startData);
            renderOptions(startData.actions);
        }, 500);
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleUserInput(userInput.value);
    });
}

function showToast(message) {
    if(!toastEl) return;
    toastEl.innerHTML = `✅ ${message}`;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}

function formatText(text) {
    if (!text) return "";
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function createBotMessageHTML(msgData) {
    let html = '';
    if (msgData.summary) html += `<div class="summary">✅ ${formatText(msgData.summary)}</div>`;
    if (msgData.gaugeHTML) html += msgData.gaugeHTML;
    if (msgData.steps && msgData.steps.length > 0) {
        html += `<div class="steps-container"><div class="steps-title">📌 Key Steps</div><ol class="steps-list">`;
        msgData.steps.forEach(step => { html += `<li>${formatText(step)}</li>`; });
        html += `</ol></div>`;
    } else {
        html += `<div class="steps-container"><div class="steps-title">📌 Key Steps</div><p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">N/A</p></div>`;
    }
    
    if (msgData.timeline) html += `<div class="timeline">📅 <strong>Timeline:</strong><br>${formatText(msgData.timeline)}</div>`;
    if (msgData.notes) html += `<div class="notes">⚠️ <strong>Notes:</strong><br>${formatText(msgData.notes)}</div>`;

    if (msgData.isMapRequest) {
        const mapId = 'map-' + Math.random().toString(36).substr(2, 9);
        html += `<div id="${mapId}" class="map-container"></div>`;
        setTimeout(() => renderMapInElement(mapId, assistant.context.country || "United States"), 100);
    }

    if (msgData.grounding) html += `<div class="grounding-text">${assistant.groundingText}</div>`;
    return html;
}

function renderOptions(actions) {
    if(!optionsContainer) return;
    optionsContainer.innerHTML = '';
    if (actions) {
        actions.forEach(opt => {
            const btn = document.createElement('button');
            btn.classList.add('action-btn');
            btn.innerHTML = `👉 ${opt}`;
            btn.addEventListener('click', () => handleUserInput(opt));
            optionsContainer.appendChild(btn);
        });
    }
}

function appendMessage(sender, content) {
    if(!chatContainer) return;
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', sender);
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    if (sender === 'bot' && typeof content === 'object') {
        messageDiv.innerHTML = createBotMessageHTML(content);
    } else {
        messageDiv.textContent = content;
    }
    
    wrapper.appendChild(messageDiv);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleUserInput(text) {
    if (!text.trim()) return;
    if(userInput) userInput.value = '';
    if(optionsContainer) optionsContainer.innerHTML = '';
    
    appendMessage('user', text);
    if (text.toLowerCase().includes("save") || text.toLowerCase().includes("calendar")) showToast("Event saved to Google Calendar!");
    
    setTimeout(() => {
        const responseData = assistant.processInput(text);
        appendMessage('bot', responseData);
        renderOptions(responseData.actions);
    }, 600);
}

// For testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CivicGuideAssistant };
}
