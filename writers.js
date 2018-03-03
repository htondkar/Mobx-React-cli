function writeSideEffects(sideEffects) {
  console.log('====================================')
  console.log(sideEffects)
  console.log('====================================')
}

function writeMobxStore(mobxStore) {
  console.log('====================================')
  console.log(mobxStore)
  console.log('====================================')
}

function writeGolbalActions(globalSideEffects) {
  console.log('====================================')
  console.log(globalSideEffects)
  console.log('====================================')
}

module.exports = { writeSideEffects, writeMobxStore, writeGolbalActions }
