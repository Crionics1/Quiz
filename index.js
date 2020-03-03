const uuid = require('uuid');
const express = require('express')
const db = require('./Server/Models/db')
const models = require('./Server/models/db');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express()


app.use(bodyParser.json());
app.use(cookieParser());

app.get('/', function (req, res) {
    res.send('hello world')
})

app.post('/checksession', function (req, res) {
    if (req.cookies['token'] == null) {
        res.sendStatus(401)
        return;
    }

    models.Session.findOne({where: {Token: req.cookies['token']}})
        .then(s => {
                if (s == null) {
                    res.sendStatus(401)
                    return;
                }

                res.send(JSON.stringify(s))
            }
        )
})

app.post('/register', function (req, res) {
    models.User.create(
        {
            FirstName: req.body.firstname,
            LastName: req.body.lastname,
            PrivateID: req.body.privateid,
            Password: req.body.password
        }
    ).then(u => {
        res.send(JSON.stringify(u))
    }).catch(r => {
        res.status(400).send(r)
    })
})

app.post('/login', function (req, res) {
    models.User.findOne({where: {PrivateID: req.body.privateid, Password: req.body.password}})
        .then(u => {
            if (u == null) {
                res.sendStatus(400)
                return
            }

            models.Session.create({
                Token: uuid.v4(),
                UserID: u.id
            }).then(s => {
                res.cookie('token', s.Token)
                res.send(JSON.stringify())
            }).catch( r => {
                res.status(500)
                    .send(JSON.stringify('internal server error'))
            })
        })
})


db.sequelize.sync({
    force: true
}).then(() => {
    app.listen(5555, () => {
        console.log('Example app listening on port 5555!')
    })
})


