const axios = require('axios')
// axios.get('http://azat.co')
//   .then((response)=>response.data)
//   .then(html => console.log(html))


axios.get('https://azat.co')
  .then((response)=>response.data)
  .then(html => console.log(html))
  .catch(e=>console.error(e))