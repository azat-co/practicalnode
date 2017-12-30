const axios = require('axios')
const getAzatsWebsite = async () => {
  try {
    const response = await axios.get('https://azat.co')
    return response.data
  } catch(e) {
    console.log('oooops')
  }
}
getAzatsWebsite().then(console.log)