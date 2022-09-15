const express = require('express')
const router =  express.Router()

const path = require('path');
router.get('/',(req,res)=>{
    res.render("./index.html")
})
router.get('/game',(req,res)=>{
    res.render("./game.html")
})

module.exports = router