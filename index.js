const express = require('express')
const db = require('./Server/Models/db')

const app = express()

db.sequelize.sync({
    force: true
}).then(() => {
    app.listen(8000, () => {
        console.log('Example app listening on port 8000!')
    })
})


