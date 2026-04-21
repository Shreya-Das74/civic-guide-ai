const assert = require('assert');
const { detectAndRespond, userContext } = require('./app.js');

console.log('Running CivicGuide AI Test Suite...\n');

function resetContext() {
    userContext.country = null;
    userContext.experienceLevel = null;
    userContext.consecutiveErrors = 0;
}

try {
    resetContext();
    let response = detectAndRespond("I am a beginner");
    assert.strictEqual(userContext.experienceLevel, 'beginner', "Experience level should be beginner.");
    console.log('✅ Test 1 Passed: Adaptive experience level recognized.');

    resetContext();
    response = detectAndRespond("usa");
    assert.strictEqual(userContext.country, 'United States', "Country context should update.");
    console.log('✅ Test 2 Passed: Country context saved successfully.');

    resetContext();
    response = detectAndRespond("Find nearest booth");
    assert.strictEqual(response.isMapRequest, true, "Should trigger a map rendering request.");
    console.log('✅ Test 3 Passed: Google Maps integration triggered correctly.');

    console.log('\n🎉 All tests passed successfully!');
    process.exit(0);

} catch (error) {
    console.error('\n❌ Test Failed!');
    console.error(error.message);
    process.exit(1);
}
