const express = require('express')

const app = express()

require('dotenv').config()
const PORT = process.env.PORT || 3000

app.use(express.json())

//calling Database function
require('./config/database').connect()

//route importing and mounting
const user = require('./routes/user')

// Mount the user routes
app.use('/user', user)

app.listen(PORT, ()=>{
    console.log("Server Started in ", PORT)
})