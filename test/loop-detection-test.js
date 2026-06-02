const { loopDetectionMiddleware } = require('../dist/middleware/loop-detection.js')
const { SddState, Phase } = require('../dist/state.js')

async function testLoopDetection() {
  console.log('=== Loop Detection Middleware Tests ===\n')
  
  const state = new SddState(process.cwd())
  await state.load()
  state.currentPhase = Phase.DEVELOPMENT
  
  // Test 1: First edit is not blocked
  console.log('Test 1: First edit is not blocked')
  state.perFileEdits = {}
  const result1 = loopDetectionMiddleware.afterEdit('edit', { file_path: 'test.js' }, state)
  console.log(`  Blocked: ${result1.blocked}`)
  console.log(`  Message: ${result1.message || 'None'}`)
  console.log(`  Expected: NOT BLOCKED`)
  console.log(`  Status: ${result1.blocked === false ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 2: 10 edits to same file triggers warning
  console.log('Test 2: 10 edits to same file triggers warning')
  state.perFileEdits = { 'test.js': 10 }
  const result2 = loopDetectionMiddleware.afterEdit('edit', { file_path: 'test.js' }, state)
  console.log(`  Blocked: ${result2.blocked}`)
  console.log(`  Message: ${result2.message || 'None'}`)
  console.log(`  Expected: WARNING (not blocked)`)
  console.log(`  Status: ${result2.blocked === false && result2.message ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 3: 20 edits to same file triggers block
  console.log('Test 3: 20 edits to same file triggers block')
  state.perFileEdits = { 'test.js': 20 }
  const result3 = loopDetectionMiddleware.afterEdit('edit', { file_path: 'test.js' }, state)
  console.log(`  Blocked: ${result3.blocked}`)
  console.log(`  Message: ${result3.message || 'None'}`)
  console.log(`  Expected: BLOCKED`)
  console.log(`  Status: ${result3.blocked === true ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 4: Different files don't trigger block
  console.log('Test 4: Different files don\'t trigger block')
  state.perFileEdits = { 'test.js': 20 }
  const result4 = loopDetectionMiddleware.afterEdit('edit', { file_path: 'other.js' }, state)
  console.log(`  Blocked: ${result4.blocked}`)
  console.log(`  Expected: NOT BLOCKED`)
  console.log(`  Status: ${result4.blocked === false ? '✅ PASS' : '❌ FAIL'}\n`)
  
  console.log('=== Test Summary ===')
  const passed = [
    result1.blocked !== true,
    result2.blocked !== true && result2.message,
    result3.blocked === true,
    result4.blocked !== true
  ].filter(x => x).length
  console.log(`Passed: ${passed}/4`)
  console.log(`Status: ${passed === 4 ? '✅ ALL PASS' : '❌ SOME FAILED'}`)
}

testLoopDetection().catch(console.error)