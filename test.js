const assert = require('assert');
const { detectAndRespond, userContext } = require('./app.js');

console.log('Running CivicGuide AI Test Suite...\n');

// Reset context before tests
function resetContext() {
    userContext.country = null;
    userContext.experienceLevel = null;
    userContext.readinessAnswers = {};
    userContext.consecutiveErrors = 0;
    userContext.hasRegistered = false;
}

try {
    // Test 1: Intent Detection - Eligibility without country
    resetContext();
    let response = detectAndRespond("am i eligible to vote?");
    assert.strictEqual(response.summary.includes('precise, localized information'), true, "Should ask for country first.");
    console.log('✅ Test 1 Passed: Requires country context for eligibility.');

    // Test 2: Intent Detection - Eligibility with country context
    resetContext();
    detectAndRespond("I am in the US"); // Sets context
    response = detectAndRespond("am i eligible?");
    assert.strictEqual(response.summary.includes('voting eligibility varies slightly by state'), true, "Should return US eligibility.");
    console.log('✅ Test 2 Passed: Uses country context properly.');

    // Test 3: Adaptive Suggestions - Registration Memory
    resetContext();
    response = detectAndRespond("I already registered to vote");
    assert.strictEqual(userContext.hasRegistered, true, "Context should update hasRegistered.");
    assert.strictEqual(response.actions.includes("Register to Vote"), false, "Should not suggest registering if already registered.");
    console.log('✅ Test 3 Passed: Adaptive action suggestions work.');

    // Test 4: Confusion Handling
    resetContext();
    detectAndRespond("sdlkfjsldkfj"); // Error 1
    response = detectAndRespond("I am so lost"); // Error 2 (triggers fallback)
    assert.strictEqual(response.summary.includes('understand this can feel overwhelming'), true, "Should trigger confusion fallback after repeated errors.");
    console.log('✅ Test 4 Passed: Confusion handling fallback works.');

    console.log('\n🎉 All tests passed successfully!');
    process.exit(0);

} catch (error) {
    console.error('\n❌ Test Failed!');
    console.error(error.message);
    process.exit(1);
}
