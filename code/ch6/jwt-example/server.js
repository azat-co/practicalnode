const SECRET = 'Practical Node, 2nd Edition'
const express = require('express')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const app = express()
app.use(bodyParser.json())
const courses = [
  {title: "You Don't Know Node"},
  {title: "AWS Intro"}
]
const users = []
const auth = (req, res, next) => {
  if (req.headers && req.headers.auth && req.headers.auth.split(' ')[0] === 'JWT') {
    jwt.verify(req.headers.auth.split(' ')[1], SECRET, (error, decoded) => {
      if (error) return res.status(401).send()
      req.user = decoded
      console.log('authenticated as ', decoded.username)
      next()
    })
  }
  else return res.status(401).send()
}

app.get('/courses', (req, res) => {
    res.send(courses)
  })
app.post('/courses', auth, (req, res) => {
    courses.push({title: req.body.title})
    res.send(courses)
  })

app.post('/auth/register', (req, res) => {
    bcrypt.hash(req.body.password, 10, (error, hash)=>{
      if (error) return res.status(500).send()
      users.push({
        username: req.body.username,
        passwordHash: hash
      })
      res.status(201).send('registered')
    })
  })

app.post('/auth/login', (req, res) => {
    const foundUser = users.find((value, index, list) => {
      if (value.username === req.body.username) return true
      else return false
    })
    if (foundUser) {
      bcrypt.compare(req.body.password, foundUser.passwordHash, (error, matched) => {
        if (!error && matched) {
          res.status(201).json({token: jwt.sign({ username: foundUser.username}, SECRET)})
        } else res.status(401).send()
      })
    } else res.status(401).send()
  })

app.listen(3000)