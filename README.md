# CivicGuide AI

An intelligent, interactive civic assistant built to help users seamlessly understand the election process, check eligibility, and prepare for election day.

## 1. Chosen Vertical
**Intelligent Civic Assistant**
This application guides users step-by-step through complex election procedures, adapts to their knowledge level, and provides structured timelines and requirements based on their location.

## 2. Approach and Logic
CivicGuide AI was built using Vanilla HTML, CSS, and JavaScript to guarantee maximum performance and a microscopic repository size (well under the 1MB limit). 

To achieve an "intelligent" feel without relying on a backend server or exposing sensitive LLM API keys on the frontend, I implemented a custom **NLP Intent Detection Engine** and a **State Memory System** in JavaScript:
- **Context Memory:** The app remembers user inputs (like their country or if they are already registered) so it never repeats redundant questions.
- **Intent Engine:** It uses regex pattern matching to analyze free-form text. If a user types "when do I vote?", it understands the intent is `timeline` and routes them appropriately.
- **Dynamic Routing:** Actions and buttons are generated dynamically. If a user fails the Readiness Quiz by missing their polling location, the system instantly generates a "Find Polling Booth" action button to solve that specific problem.

## 3. How the Solution Works
1. **Interactive Chat Interface:** Users interact with the assistant via quick-action buttons or by typing naturally.
2. **Readiness Score (WOW Feature):** Users can click "Check My Readiness". The AI asks 4 questions and calculates a percentage score, rendering a dynamic visual gauge directly in the chat to show them how prepared they are.
3. **Google Ecosystem Integrations:** The assistant provides simulated, fully-functional URI links to Google Calendar (to add election dates) and Google Maps (to find polling stations).
4. **Confusion Handling:** If a user repeatedly enters unknown text or asks for "help", the assistant detects they are stuck and switches to a simplified fallback flow.

## 4. Assumptions Made
- **API Keys & Backend:** Because this is a frontend-only competition submission (and to keep it under 1MB), I assumed that hardcoded, simulated integrations for Google Maps and Calendar via standard URL parameters were preferred over setting up an active OAuth/Cloud backend.
- **Eligibility Data:** The election rules for US, UK, and India are simplified generalizations meant to demonstrate the logic and conditional routing of the assistant.

## 5. Evaluation Focus Areas Addressed
- **Code Quality:** Clean, modular Vanilla JS logic separated into state management, intent detection, and UI rendering.
- **Security:** No external dependencies means zero supply-chain vulnerabilities. 
- **Efficiency:** The entire application is just 3 lightweight files. It loads instantly and the repository size is fractions of a megabyte.
- **Testing:** A native Node.js test suite (`test.js`) is included to validate the NLP logic and state updates.
- **Accessibility:** ARIA roles (`aria-live`), semantic labels (`aria-label`), and robust keyboard focus states (`:focus-visible`) have been implemented to ensure inclusive design.
- **Google Services:** Meaningful integration of Google Maps (location lookup) and Google Calendar (event templates).

## How to Run
Simply open `index.html` in any modern web browser to interact with CivicGuide AI!
To run the automated test suite, ensure Node.js is installed and run:
`node test.js`
