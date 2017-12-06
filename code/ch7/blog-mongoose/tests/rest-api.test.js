const boot = require('../app').boot
const shutdown = require('../app').shutdown
const port = require('../app').port
const superagent = require('superagent')
const expect = require('expect.js')

// TODO: seed from the test and then clean up
const seedArticles = require('../db/articles.json')
// const seedUsers = require('../db/users.json')

const baseUrl = `http://localhost:${port}/api/articles/`

describe('server', function () {
  before(function () {
    boot()
  })

  describe('express rest api server', function(){
    const newText = '{{REDUCTED}}'
    let id
    let slug
  
    it('posts an object', function(done){
      superagent.post(baseUrl)
        .send({article:seedArticles[0]})
        .end(function(e, res){
          // console.log(res.body)
          expect(e).to.eql(null)
          expect(res.body._id.length).to.eql(24)
          id = res.body._id
          slug = res.body.slug
          done()
        })
    })
  
    // it('retrieves an object', function(done){
    //   superagent.get(`${baseUrl}${slug}`)
    //     .end(function(e, res){
    //       console.log(res.body)
    //       expect(e).to.eql(null)
    //       expect(typeof res.body).to.eql('object')
    //       expect(res.body._id.length).to.eql(24)
    //       expect(res.body._id).to.eql(id)
    //       expect(res.body.name).to.eql('John')
    //       done()
    //     })
    // })
  
    it('retrieves a collection', function(done){
      superagent.get(baseUrl)
        .end(function(e, res){
          // console.log(res.body)
          expect(e).to.eql(null)
          expect(res.body.articles.length).to.be.above(0)
          expect(res.body.articles.map(function (item){return item._id})).to.contain(id)
          done()
        })
    })
  
    it('updates an object', function(done){

      superagent.put(baseUrl+id)
        .send({
          article: {text: newText}
        })
        .end(function(e, res){
          // console.log(res.body)
          expect(e).to.eql(null)
          expect(typeof res.body).to.eql('object')
          expect(res.body._id).to.eql(id)
          expect(res.body.text).to.eql(newText)
          done()
        })
    })
  
    it('checks an updated object', function(done){
      superagent.get(baseUrl)
      .end(function(e, res){
        // console.log(res.body)
        expect(e).to.eql(null)
        expect(res.body.articles.length).to.be.above(0)
        const iDs = res.body.articles.map(function (item){return item._id})
        expect(iDs).to.contain(id)
        expect(res.body.articles[iDs.indexOf(id)].text).to.equal(newText)
        done()
      })
    })

    it('removes an object', function(done){
      superagent.del(baseUrl+id)
        .end(function(e, res){
          // console.log(res.body)
          expect(e).to.eql(null)
          expect(typeof res.body).to.eql('object')
          expect(res.body._id).to.eql(id)
          done()
        })
    })

    it('checks an removed object', function(done){
      superagent.get(baseUrl)
        .end(function(e, res){
          // console.log(res.body)
          expect(e).to.eql(null)
          expect(res.body.articles.map(function (item){return item._id})).to.not.be(id)
          done()
        })
    })
        
  })

  after(function () {
    shutdown()
  })
})



