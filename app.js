// CivicGuide AI Core Engine

// 1. Context Memory State
const userContext = {
    country: null,
    experienceLevel: null, // 'first-time' or 'experienced'
    readinessAnswers: {},
    consecutiveErrors: 0,
    hasRegistered: false
};

// 2. Intent Detection Patterns (NLP regex)
const intents = {
    check_eligibility: /eligib|can i vote|am i allowed/i,
    register: /register|sign up|enroll/i,
    timeline: /when|date|deadline|timeline|calendar/i,
    readiness: /readiness|ready|score|prepared/i,
    polling_booth: /where|booth|station|location|find/i,
    help: /help|confused|don't understand|stuck/i,
    country_us: /usa|us|united states|america/i,
    country_uk: /uk|united kingdom|britain|england/i,
    country_in: /india|in/i,
    yes: /\byes\b|yeah|yep|sure/i,
    no: /\bno\b|nope|nah/i,
    start_over: /start over|reset|restart/i,
    greeting: /hello|hi|hey|greetings|howdy/i
};

// Helper for dynamic variations
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Dynamic Conversational Prefixes
const getPrefix = () => {
    const prefixes = ["I'd be happy to explain.", "Great question.", "Here's what you need to know.", "Let's break that down."];
    return getRandom(prefixes) + " ";
};

const getContextualAcknowledge = () => {
    if (userContext.country) {
        return getRandom([
            `Since you're voting in the ${userContext.country}, `,
            `Focusing specifically on the ${userContext.country}, `,
            `For your location (${userContext.country}), `
        ]);
    }
    return "";
};

// 3. Conversation Flows and Responses (now dynamic generators)
const flowGenerators = {
    start: () => ({
        summary: getRandom([
            "Hello! I am CivicGuide AI, your intelligent election companion.",
            "Welcome back! CivicGuide AI is ready to help you prepare.",
            "Hi there! I'm here to make the election process easy to understand."
        ]),
        steps: ["Let's make sure you're fully prepared for the upcoming elections."],
        notes: "I'll remember our conversation so we can skip repeating details.",
        actions: ["Check Eligibility", "Register to Vote", "Check My Readiness", "View Election Dates"]
    }),
    
    ask_country: () => ({
        summary: "To give you precise, localized information, I need to know where you vote.",
        steps: ["Please tell me or select your country below."],
        actions: ["United States", "United Kingdom", "India", "Other"]
    }),
    
    eligibility_us: () => ({
        summary: getContextualAcknowledge() + "voting eligibility varies slightly by state, but federal rules apply.",
        steps: [
            "You must be a U.S. citizen.",
            "Meet your state's specific residency requirements.",
            "Be 18 years old on or before Election Day."
        ],
        notes: "If you have a felony conviction, check your specific state's rules. Rights are often restored after completing a sentence.",
        actions: userContext.hasRegistered ? ["Check My Readiness", "View Election Dates"] : ["Register to Vote", "Check My Readiness", "View Election Dates"]
    }),
    
    eligibility_uk: () => ({
        summary: getContextualAcknowledge() + "you must be on the electoral register to participate.",
        steps: [
            "Be aged 18 or over on polling day.",
            "Be a British, Irish, or qualifying Commonwealth citizen.",
            "Be resident at a UK address."
        ],
        notes: "You can register at 16 (or 14 in Scotland/Wales) but can't legally vote until you're 18.",
        actions: userContext.hasRegistered ? ["Check My Readiness", "View Election Dates"] : ["Register to Vote", "Check My Readiness"]
    }),
    
    eligibility_in: () => ({
        summary: getContextualAcknowledge() + "the Election Commission oversees all eligibility criteria.",
        steps: [
            "Be a citizen of India.",
            "Be 18 years of age on the qualifying date (usually Jan 1st).",
            "Be an ordinary resident of the polling area."
        ],
        notes: "You must have a Voter ID card (EPIC) or be listed on the electoral roll.",
        actions: userContext.hasRegistered ? ["Check My Readiness", "View Election Dates"] : ["Register to Vote", "Check My Readiness"]
    }),
    
    register_general: () => ({
        summary: getPrefix() + "Registering to vote is your crucial first step.",
        steps: [
            "Visit your official government election website.",
            "Fill out the voter registration application.",
            "Provide required identification (like a Driver's License or National ID)."
        ],
        timeline: "Do this as soon as possible. Deadlines are often 15-30 days before the election.",
        actions: ["Check My Readiness", "Find Polling Booth"]
    }),
    
    timeline_general: () => ({
        summary: getContextualAcknowledge() + "election dates depend heavily on your specific locality.",
        steps: [
            "Check your local government's official website for exact dates."
        ],
        timeline: "Upcoming Major Elections: Next Tuesday (Local/Municipal).",
        actions: ["Add to Calendar", "Find Polling Booth"]
    }),
    
    polling_booth: () => ({
        summary: "You can easily find your exact polling station online.",
        steps: [
            "Click the button below to search your local area using maps."
        ],
        actions: ["Search Maps for Polling Station", "Check My Readiness"]
    }),
    
    confusion_fallback: () => ({
        summary: "I understand this can feel overwhelming. Let's make it very simple.",
        steps: [
            "1. First, make sure you are registered.",
            "2. Second, know the date of the election.",
            "3. Third, know where your polling place is."
        ],
        notes: "Take it one step at a time. Click 'Register to Vote' if you haven't done that yet.",
        actions: ["Register to Vote", "Start Over"]
    }),
    
    unknown: () => ({
        summary: getRandom([
            "I didn't quite catch that.",
            "I'm not entirely sure what you mean.",
            "Could you rephrase that for me?"
        ]),
        steps: ["Try selecting one of the options below, or asking a specific question like 'How do I register?'"],
        actions: ["Check Eligibility", "Check My Readiness", "Register to Vote"]
    })
};

// Readiness Flow State
const readinessQuestions = [
    { id: 'q1', text: "Are you currently registered to vote at your current address?" },
    { id: 'q2', text: "Do you know the exact date of your next election?" },
    { id: 'q3', text: "Do you know where your polling station is located?" },
    { id: 'q4', text: "Do you have the necessary ID required to vote in your area?" }
];
let currentReadinessIndex = -1;

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const optionsContainer = document.getElementById('optionsContainer');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');

// Format text (Bold/Italic)
function formatText(text) {
    if (!text) return "";
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return formatted;
}

// Render Bot Message HTML
function createBotMessageHTML(msgData) {
    let html = '';
    
    if (msgData.summary) {
        html += `<div class="summary">✅ ${formatText(msgData.summary)}</div>`;
    }
    
    if (msgData.steps && msgData.steps.length > 0) {
        html += `<div class="steps-container">
                    <div class="steps-title">📌 Key Steps</div>
                    <ol class="steps-list">`;
        msgData.steps.forEach(step => { html += `<li>${formatText(step)}</li>`; });
        html += `</ol></div>`;
    }
    
    if (msgData.timeline) {
        html += `<div class="timeline">📅 <strong>Important Timeline:</strong><br>${formatText(msgData.timeline)}</div>`;
    }
    
    if (msgData.notes) {
        html += `<div class="notes">⚠️ <strong>Important Notes:</strong><br>${formatText(msgData.notes)}</div>`;
    }

    // Google Ecosystem Integration Links
    if (msgData.actions && msgData.actions.includes("Add to Calendar")) {
        const calLink = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Election+Day&details=Don't+forget+to+vote!&dates=20241105T120000Z/20241105T130000Z";
        html += `<a href="${calLink}" target="_blank" class="integration-link">📅 Add Election to Google Calendar</a>`;
        msgData.actions = msgData.actions.filter(a => a !== "Add to Calendar");
    }

    if (msgData.actions && msgData.actions.includes("Search Maps for Polling Station")) {
        const mapsLink = "https://www.google.com/maps/search/polling+station+near+me";
        html += `<a href="${mapsLink}" target="_blank" class="integration-link">📍 Find Polling Station on Google Maps</a>`;
        msgData.actions = msgData.actions.filter(a => a !== "Search Maps for Polling Station");
    }

    // Readiness Score UI Render
    if (msgData.isReadinessScore) {
        const score = calculateReadinessScore();
        let deg = (score / 100) * 360;
        
        html += `<div class="readiness-widget">
            <div class="summary">Your Election Readiness Score</div>
            <div class="score-circle" style="--score-deg: ${deg}deg">
                <span class="score-value">${score}%</span>
            </div>
            <div class="readiness-details">
                <div><span class="${userContext.readinessAnswers['q1'] ? 'status-yes' : 'status-no'}">${userContext.readinessAnswers['q1'] ? '✅' : '❌'}</span> Registered to vote</div>
                <div><span class="${userContext.readinessAnswers['q2'] ? 'status-yes' : 'status-no'}">${userContext.readinessAnswers['q2'] ? '✅' : '❌'}</span> Knows election date</div>
                <div><span class="${userContext.readinessAnswers['q3'] ? 'status-yes' : 'status-no'}">${userContext.readinessAnswers['q3'] ? '✅' : '❌'}</span> Knows polling location</div>
                <div><span class="${userContext.readinessAnswers['q4'] ? 'status-yes' : 'status-no'}">${userContext.readinessAnswers['q4'] ? '✅' : '❌'}</span> Has required ID</div>
            </div>
        </div>`;
    }
    
    return html;
}

function calculateReadinessScore() {
    let yesCount = 0;
    Object.values(userContext.readinessAnswers).forEach(ans => {
        if (ans === true) yesCount++;
    });
    return Math.round((yesCount / readinessQuestions.length) * 100);
}

// Append Message to UI
function appendMessage(sender, content) {
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

function showTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', 'bot');
    wrapper.id = 'typingIndicator';
    wrapper.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function renderOptions(options) {
    optionsContainer.innerHTML = '';
    if (!options) return;
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.classList.add('action-btn');
        btn.innerHTML = `👉 ${opt}`;
        btn.addEventListener('click', () => handleUserInput(opt));
        optionsContainer.appendChild(btn);
    });
}

// Main Intent Logic
function detectAndRespond(text) {
    let responseData = null;

    // 1. Handling Readiness Quiz Flow
    if (currentReadinessIndex >= 0 && currentReadinessIndex < readinessQuestions.length) {
        if (intents.yes.test(text)) {
            userContext.readinessAnswers[readinessQuestions[currentReadinessIndex].id] = true;
            if (currentReadinessIndex === 0) userContext.hasRegistered = true; // Update context if they are registered
        } else {
            userContext.readinessAnswers[readinessQuestions[currentReadinessIndex].id] = false;
        }
        currentReadinessIndex++;
        
        if (currentReadinessIndex < readinessQuestions.length) {
            return {
                summary: `Question ${currentReadinessIndex + 1} of 4:`,
                steps: [readinessQuestions[currentReadinessIndex].text],
                actions: ["Yes", "No"]
            };
        } else {
            currentReadinessIndex = -1; // End quiz
            
            // Smart actions based on quiz failure
            const nextActions = [];
            if (!userContext.readinessAnswers['q1']) nextActions.push("Register to Vote");
            if (!userContext.readinessAnswers['q2']) nextActions.push("View Election Dates");
            if (!userContext.readinessAnswers['q3']) nextActions.push("Find Polling Booth");
            if (nextActions.length === 0) nextActions.push("Add to Calendar"); // They are 100% ready!
            else nextActions.push("Start Over");

            return {
                isReadinessScore: true,
                summary: "Quiz Complete! Here is how prepared you are.",
                steps: ["Review your score above. Let's work on the items you missed."],
                actions: nextActions
            };
        }
    }

    // 2. Setting Context based on input
    if (intents.country_us.test(text)) userContext.country = 'US';
    else if (intents.country_uk.test(text)) userContext.country = 'UK';
    else if (intents.country_in.test(text)) userContext.country = 'India';
    
    // Explicitly declaring they registered
    if (intents.register.test(text) && text.toLowerCase().includes("i already")) {
        userContext.hasRegistered = true;
        return {
            summary: "Great! I've noted that you are already registered.",
            steps: ["Now we can focus on finding your polling station or election dates."],
            actions: ["View Election Dates", "Find Polling Booth", "Check My Readiness"]
        };
    }

    // 3. Routing based on Intent
    if (intents.start_over.test(text) || intents.greeting.test(text)) {
        if (intents.start_over.test(text)) {
            userContext.country = null;
            userContext.consecutiveErrors = 0;
            userContext.hasRegistered = false;
        }
        responseData = flowGenerators.start();
    }
    else if (intents.help.test(text)) {
        responseData = flowGenerators.confusion_fallback();
    }
    else if (intents.readiness.test(text)) {
        currentReadinessIndex = 0;
        userContext.readinessAnswers = {}; // reset
        responseData = {
            summary: "Let's calculate your Election Readiness Score.",
            steps: [readinessQuestions[0].text],
            actions: ["Yes", "No"]
        };
    }
    else if (intents.check_eligibility.test(text)) {
        if (!userContext.country) responseData = flowGenerators.ask_country();
        else if (userContext.country === 'US') responseData = flowGenerators.eligibility_us();
        else if (userContext.country === 'UK') responseData = flowGenerators.eligibility_uk();
        else if (userContext.country === 'India') responseData = flowGenerators.eligibility_in();
    }
    else if (intents.register.test(text)) {
        responseData = flowGenerators.register_general();
    }
    else if (intents.timeline.test(text)) {
        responseData = flowGenerators.timeline_general();
    }
    else if (intents.polling_booth.test(text)) {
        responseData = flowGenerators.polling_booth();
    }
    
    // Country selected directly
    else if (text === "United States" || intents.country_us.test(text)) responseData = flowGenerators.eligibility_us();
    else if (text === "United Kingdom" || intents.country_uk.test(text)) responseData = flowGenerators.eligibility_uk();
    else if (text === "India" || intents.country_in.test(text)) responseData = flowGenerators.eligibility_in();

    // 4. Fallback and Confusion Handling
    if (!responseData) {
        userContext.consecutiveErrors++;
        if (userContext.consecutiveErrors >= 2) {
            responseData = flowGenerators.confusion_fallback();
            userContext.consecutiveErrors = 0; // reset
        } else {
            responseData = flowGenerators.unknown();
        }
    } else {
        userContext.consecutiveErrors = 0;
    }

    return responseData;
}

function handleUserInput(text) {
    if (!text.trim()) return;
    userInput.value = '';
    optionsContainer.innerHTML = '';
    
    appendMessage('user', text);
    showTypingIndicator();
    
    // Dynamic simulated typing delay based on assumed response length (mocked with simple random + base)
    // Makes it feel less robotic
    const typingDelay = 700 + Math.random() * 800;
    
    setTimeout(() => {
        removeTypingIndicator();
        const responseData = detectAndRespond(text);
        
        // Deep copy
        const clonedData = JSON.parse(JSON.stringify(responseData));
        
        appendMessage('bot', clonedData);
        renderOptions(clonedData.actions);
    }, typingDelay);
}

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUserInput(userInput.value);
});

function init() {
    setTimeout(() => {
        const startData = JSON.parse(JSON.stringify(flowGenerators.start()));
        appendMessage('bot', startData);
        renderOptions(startData.actions);
    }, 600);
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', init);
}

// For testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        detectAndRespond,
        userContext,
        intents
    };
}
