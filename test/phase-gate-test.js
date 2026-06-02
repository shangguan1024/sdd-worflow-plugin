const { phaseGateMiddleware } = require('../dist/middleware/phase-gate.js')
const { SddState, Phase } = require('../dist/state.js')

async function testPhaseGate() {
  console.log('=== Phase Gate Middleware Tests ===\n')
  
  const state = new SddState(process.cwd())
  await state.load()
  
  // Test 1: Phase 0 blocks edit/write/bash
  state.currentPhase = Phase.UNDERSTANDING
  console.log('Test 1: Phase 0 blocks edit tool')
  const result1 = phaseGateMiddleware(state.currentPhase, 'edit', state)
  console.log(`  Result: ${result1.allowed ? 'ALLOWED' : 'BLOCKED'}`)
  console.log(`  Message: ${result1.message || 'None'}`)
  console.log(`  Expected: BLOCKED`)
  console.log(`  Status: ${result1.allowed === false ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 2: Phase 0 allows read/glob/grep
  console.log('Test 2: Phase 0 allows read tool')
  const result2 = phaseGateMiddleware(state.currentPhase, 'read', state)
  console.log(`  Result: ${result2.allowed ? 'ALLOWED' : 'BLOCKED'}`)
  console.log(`  Expected: ALLOWED`)
  console.log(`  Status: ${result2.allowed === true ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 3: Phase 1 blocks bash
  state.currentPhase = Phase.REQUIREMENTS
  console.log('Test 3: Phase 1 blocks bash tool')
  const result3 = phaseGateMiddleware(state.currentPhase, 'bash', state)
  console.log(`  Result: ${result3.allowed ? 'ALLOWED' : 'BLOCKED'}`)
  console.log(`  Message: ${result3.message || 'None'}`)
  console.log(`  Expected: BLOCKED`)
  console.log(`  Status: ${result3.allowed === false ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 4: Phase 1 allows edit/write
  console.log('Test 4: Phase 1 allows edit tool')
  const result4 = phaseGateMiddleware(state.currentPhase, 'edit', state)
  console.log(`  Result: ${result4.allowed ? 'ALLOWED' : 'BLOCKED'}`)
  console.log(`  Expected: ALLOWED`)
  console.log(`  Status: ${result4.allowed === true ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 5: Phase 2 allows all tools
  state.currentPhase = Phase.PLANNING
  console.log('Test 5: Phase 2 allows all tools')
  const result5a = phaseGateMiddleware(state.currentPhase, 'edit', state)
  const result5b = phaseGateMiddleware(state.currentPhase, 'bash', state)
  console.log(`  edit: ${result5a.allowed ? 'ALLOWED' : 'BLOCKED'}`)
  console.log(`  bash: ${result5b.allowed ? 'ALLOWED' : 'BLOCKED'}`)
  console.log(`  Expected: BOTH ALLOWED`)
  console.log(`  Status: ${result5a.allowed && result5b.allowed ? '✅ PASS' : '❌ FAIL'}\n`)
  
  console.log('=== Test Summary ===')
  const passed = [result1.allowed === false, result2.allowed === true, result3.allowed === false, result4.allowed === true, result5a.allowed && result5b.allowed].filter(x => x).length
  console.log(`Passed: ${passed}/5`)
  console.log(`Status: ${passed === 5 ? '✅ ALL PASS' : '❌ SOME FAILED'}`)
}

testPhaseGate().catch(console.error)