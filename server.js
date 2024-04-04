const express = require('express')
const cors = require('cors');

const app = express()
const expressListEndpoints = require('express-list-endpoints');

require('dotenv').config()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.use(cors());

require('./config/database').connect()

const user = require('./routes/user')

app.use('/user', user)
console.log(expressListEndpoints(app));

app.listen(PORT, ()=>{
    console.log("Server Started in", PORT)
})