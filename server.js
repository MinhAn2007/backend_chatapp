const express = require('express')
const cors = require('cors');

const app = express()

require('dotenv').config()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.use(cors());

require('./config/database').connect()

const user = require('./routes/user')

app.use('/user', user)

app.listen(PORT, ()=>{
    console.log("Server Started in ", PORT)
})