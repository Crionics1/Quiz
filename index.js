const uuid = require('uuid');
const express = require('express')
const db = require('./Server/Models/db')
const models = require('./Server/models/db');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express()

async function getUserID(req){
    let id = await models.Session.findOne({
        where: {token: req.cookies['token']}
    })

    return id;
}

app.use(bodyParser.json());
app.use(cookieParser());
app.use('/r', async function(req,res,next){
    req.requestTime = Date.now()
    req.clientID = (await getUserID(req))

    if (req.clientID == null){
        res.sendStatus(401)
        return
    }

    next()
});

//  AUTHENTICATION ACTIONS

app.get('/', function (req, res) {
    res.send('hello world')
})

app.post('/r/checksession', function (req, res) {
    res.send(JSON.stringify(req.clientID))
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


//QUIZ ACTIONS

app.post('/r/Quiz'), function(req, res){


    models.sequelize.create({
        gameStatus: 1
        //todo
    })
}

db.sequelize.sync({
    force: true
}).then(async () => {
// seed database
    await models.User.create({
        firstName: 'luka',
        lastName: 'turmanidze',
        privateID: '6100107',
        password: '123'
    }) 

    await models.Question.bulkCreate([
        {
            condition: 'which is A?',
            points: 2,
            QuestionAnswers: [
                {
                    answer: 'A',
                    isTrue: true
                },{
                    answer: 'B',
                    isTrue: false
                },{
                    answer: 'C',
                    isTrue: false
                },{
                    answer: 'D',
                    isTrue: false
                }
            ]
        },
        {
            condition: 'which is B?',
            points: 2,
            QuestionAnswers: [
                {
                    answer: 'A',
                    isTrue: false
                },{
                    answer: 'B',
                    isTrue: true
                },{
                    answer: 'C',
                    isTrue: false
                },{
                    answer: 'D',
                    isTrue: false
                }
            ]
        },
        {
            condition: 'which is C?',
            points: 2,
            QuestionAnswers: [
                {
                    answer: 'A',
                    isTrue: false
                },{
                    answer: 'B',
                    isTrue: false
                },{
                    answer: 'C',
                    isTrue: true
                },{
                    answer: 'D',
                    isTrue: false
                }
            ]
        },
        {
            condition: 'which is D?',
            points: 2,
            QuestionAnswers: [
                {
                    answer: 'A',
                    isTrue: false
                },{
                    answer: 'B',
                    isTrue: false
                },{
                    answer: 'C',
                    isTrue: false
                },{
                    answer: 'D',
                    isTrue: true
                }
            ]
        }
        ],
        {
            include: [{
                association: models.Question.Answers
            }]
        })

    models.Question.findAndCountAll({
        include:[{
            model: models.QuestionAnswer
        }]
    }).then(
        q => 
            console.log(JSON.stringify(q,null,2))
    )


    app.listen(5555, () => {
        console.log('Example app listening on port 5555!')
    })
})


