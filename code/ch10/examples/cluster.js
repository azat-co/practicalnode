const cluster = require('cluster')
const numCPUs = require('os').cpus().length
const express = require('express')

if (cluster.isMaster) {
  console.log(' Fork %s worker(s) from master', numCPUs)
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }
  cluster.on('online', (worker) => {
    console.log('worker is running on %s pid', worker.process.pid)
  })
  cluster.on('exit', (worker, code, signal) => {
    console.log('worker with %s is closed', worker.process.pid)
  })
} else if (cluster.isWorker) {
  const port = 3000
  console.log('worker (%s) is now listening to http://localhost:%s', cluster.worker.process.pid, port)
  const app = express()
  app.get('*', (req, res) => {
    res.status(200).send(`cluser ${cluster.worker.process.pid} responded \n`)
  })
  app.listen(port)
}
