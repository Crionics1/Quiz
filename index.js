const uuid = require('uuid');
const express = require('express')
const db = require('./Server/Models/db')
const models = require('./Server/models/db');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express()

async function getUserID(req){
    if(req.cookies['token'] == null || req.cookies['token'] == undefined){
        return null
    }

    let id = await models.Session.findOne({
        where: {token: req.cookies['token']}
    })

    return id;
}

app.use(bodyParser.json());
app.use(cookieParser());
app.use('/r/', async function(req,res,next){
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
    models.User.findOne({where: {privateID: req.body.privateid, password: req.body.password}})
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

app.post('/', function (req,res){
    res.send(JSON.stringify(true))
})

///QUIZ ACTIONS

app.post('/quiz' ,async function(req, res){
    const t = await db.sequelize.transaction();
    try{
        let q = await models.Quiz.create({
            gameStatus: 1,
            UserID : req.clientID 
        },{transaction :t});
        q.Questions = await q.setQuestions(req.body.questions,{ transaction: t })
        q.Users = await q.setUsers(req.clientID, {transaction: t})

        console.log(JSON.stringify(q,null,2))
        await t.commit();

        res.sendStatus(201);
    } catch (error) {
        await t.rollback();
        res.sendStatus(500);
    }
})

app.get('/quizquestions',async function(req,res){
    let quiz = await models.Quiz.findByPk(req.query.quizid,
        {
            include:[
                {model: models.Question, 
                    include:[{model: models.QuestionAnswer,attributes: ['answer']}]}
            ]
    })

    res.send(JSON.stringify(quiz, null, 2))
})

app.get('/quiz', async function(req,res){
    let quizzes = await models.Quiz.findAll({where: {gameStatus: 1}})

    res.send(JSON.stringify(quizzes, null, 2))
})

app.post('/joinquiz',async function(req,res){
    let quiz = await models.Quiz.findByPk(req.query.quizid)

    if(quiz == null){
        res.sendStatus(404);
    }
        
    try{
        await models.QuizUser.create({
            QuizID: quiz.id,
            UserID: req.clientID
        })

        res.sendStatus(200);
    }catch{
        res.sendStatus(500);
    }
})

app.get('/quizmembers', async function(req,res){
    let quizusers = await models.QuizUser.findAll({where: {QuizID: req.query.quizid}},{include : [{model: models.User}]});

    res.send(JSON.stringify(quizusers,null,2))
})

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


