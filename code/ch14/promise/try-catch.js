try {
  JSON.parse('not valid json for sure')
} catch (e) {
  console.error('nice message you will see')
}
console.log('still working')

try {
  setTimeout(()=>JSON.parse('not valid json for sure'), 0)
} catch (e) {
  console.error('nice message you will never see')
}
console.log('still working')