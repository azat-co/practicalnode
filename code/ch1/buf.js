const bufFromArray = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72])
console.log(bufFromArray.toString()) // "buffer"

const arrayBuffer = new Uint16Array(2)
arrayBuffer[0] = 5
arrayBuffer[1] = 7000

// Shares memory with `arrayBuffer`
const bufFromArrayBuffer = Buffer.from(arrayBuffer.buffer)

// Prints: <Buffer 05 00 58 1b>
console.log(bufFromArrayBuffer)

// Changing the original Uint16Array changes the Buffer also
arrayBuffer[1] = 7001

// Prints: <Buffer 05 00 59 1b>
console.log(bufFromArrayBuffer)

const bufFromString = Buffer.from('¿Cómo está?')

console.log(bufFromString.toString('utf8')) // ¿Cómo está?
console.log(bufFromString.toString()) // ¿Cómo está?

console.log(bufFromString.toString('ascii')) // B?CC3mo estC!?

const bufFromHex = Buffer.from('c2bf43c3b36d6f20657374c3a13f', 'hex')

console.log(bufFromHex.toString()) // ¿Cómo está?