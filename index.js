const uuid = require('uuid');
const express = require('express')
const path = require('path');
const db = require('./Server/Models/db')
const models = require('./Server/models/db');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const socket = require("socket.io")
const ejs = require("ejs");
const cookie = require('cookie');

const app = express()
var io = {};

async function getUserID(token){
    if(token == undefined ||token == null ){
        return null
    }

    let session = await models.Session.findOne({
        where: {token: token}
    })
    if (session == null){
        return null;
    }

    return session.dataValues.id;
}

// Use the EJS templating engine
app.set("view engine", "ejs");

// Look for view files in the view directory
app.set("views", __dirname + "/Server/Views");
app.use(express.static(path.join(__dirname + "/Public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/r/', async function(req,res,next){
    if (!req.cookies['token']){
        res.sendStatus(401)
        return
    }

    req.requestTime = Date.now()
    req.clientID = await getUserID(req.cookies['token'])

    next()
});

//<editor-fold desc="Views">

    app.get('/', function (req, res) {
        res.render('login')
    })

    app.get('/quizzes', function(req,res){
        res.render('gameList')
    })

    app.get('/quiz/:quizId', async function(req,res){
        //IF ADMIN IS REQUESTION RENDER ADMIN PAGE
        req.clientID = await getUserID(req.cookies['token'])
        if (req.clientID == 1){
            res.render('gameAdmin', {quizId: req.params.quizId})
            return
        }
        res.render('game', {quizId: req.params.quizId})
    })

//</editor-fold>

//<editor-fold desc="Authentication">

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

    app.post('/login', async function (req, res) {
        try{
            let user = await models.User.findOne({where: {privateID: req.body.privateId}})
            if (user == null) {
                res.sendStatus(400)
                return
            }

            const t = await db.sequelize.transaction();

            let s = await models.Session.create({
                Token: uuid.v4()
            },{transaction: t})
            await s.setUser(user.id, {transaction: t})

            t.commit()

            res.cookie('token', s.Token)
            res.sendStatus(200);
        }catch( error ){
            t.rollback()
            res.status(500)
                .send(JSON.stringify('internal server error'))
        }
    })

//</editor-fold>

/*
app.post('/r/quiz' ,async function(req, res){
    const t = await db.sequelize.transaction();
    try{
        let q = await models.Quiz.create({
            gameStatus: 1,
            adminId: req.clientID
        },{transaction :t});
        q.setUsers([req.clientID])

        //associate quiz with existing questions
        if (req.body.questions != undefined){
            let questions = []
            for(let i = 0 ;i < req.body.questions.length ; i ++){
                questions[i] = {questionId: req.body.questions[i], quizId: q.id}
            }
            q.Questions = await models.QuizQuestion.bulkCreate(questions,{transaction: t})
        }

        //insert and associate quiz with custom questions
        if (req.body.customQuestions != undefined){
            let customQuestions = []
            for (let i=0;i < req.body.customQuestions.length; i++){
                customQuestions[i] = {condition: req.body.customQuestions[i] ,points: req.body.customQuestionPoints[i], isCustom: true}
            }

            //insert custom question in questions
            let insertedCustomQuestions = await models.Question.bulkCreate(customQuestions,{transaction:t})

            //create association model
            let quizCustomQuestions = []
            for (let i = 0; i < insertedCustomQuestions.length; i++){
                quizCustomQuestions[i] = {questionId: insertedCustomQuestions[i].id, quizId: q.id }
            }

            //associate quiz with custom questions
            await models.QuizQuestion.bulkCreate(quizCustomQuestions,{transaction: t})
        }

        await t.commit();

        res.sendStatus(201);
    } catch (error) {
        await t.rollback();
        res.sendStatus(500);
    }
})
*/

app.get('/quiz', async function(req,res){
    let quizzes = await models.Quiz.findAll({
        where: {gameStatus: 1},
        attributes: ['id', 'adminId']
    })

    res.send(JSON.stringify(quizzes, null, 2))
})


app.post('/r/startquiz/:quizId', async function(req,res) {
    try{
        let quiz = await models.Quiz.findOne({where: {id: req.params.quizId, gameStatus: 1}})

        if (quiz == null){
            res.sendStatus(404)
            return
        }

        if (quiz.adminId != req.clientID){
            res.sendStatus(401);
            return
        }

        quiz.gameStatus = 2
        await quiz.save()


        res.sendStatus(200)
    }catch(error){
        res.sendStatus(500)
    }
})

app.post('/nextQuestion', async function(req,res){
    let quizQuestion = models.QuizQuestion.findOne({
        where: {
            quizId: req.body.quizId,
            countDownStart:{
                [OP.not]: null
            },
            order:['id']
        },
        include:{
            model:models.Question,
            attributes: ['isCustom','condition']
        }
    })


})

//TODO
app.get('/quizmembers', async function(req,res){
    let quiz = await models.User.findByPk(req.query.quizid,
        {
            attributes: ["firstname","lastname","id"],
            include:[{
                model: models.Quiz,
                where:{ id: req.body.quiz}
            }],
            order: [['countDownStart','DESC']]
        }
    );

    let quizAnswers = models.QuizAnswer.findAll({
        attributes: [
            'userId',
            [sequelize.fn('sum', sequelize.col('points')), 'points'],
        ],
        group: ['quizId','userId']
    })

    res.send(JSON.stringify(users,null,2))
})

//TODO
app.get('/quizquestions',async function(req,res){
    let quiz = await models.QuizAnswer

    res.send(JSON.stringify(quiz, null, 2))
})

app.get('/question',async function(req,res) {
    try{
        let questions = await models.Question.findAll({ where: { isCustom: 0 }})

        res.send(JSON.stringify(questions,null,2))
    } catch (error) {
        res.sendStatus(500)
    }
})

db.sequelize.sync({
    force: true
    }).then(async () => {
// seed database
    await models.User.create({
        firstName: 'luka',
        lastName: 'turmanidze',
        privateID: 'admin'
    })

    await models.Question.bulkCreate([
        {
            condition: 'which is A?',
            points: 2,
            isCustom:false,
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
            isCustom:false,
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
            isCustom:false,
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
            isCustom:false,
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

    let questions = models.Question.findAndCountAll({
        include:[{
            model: models.QuestionAnswer
        }]
    })
    .then(q =>
        console.log(JSON.stringify(q,null,2))
    )

    let quiz = await models.Quiz.create({
        gameStatus : 1,
        adminId: 1
    })

    let questionIds = []
    for (let i=0; i< questions.length; i++){
        questionIds[i] = questions[i].id
    }
    await quiz.setQuestions(questionIds)


    const server = app.listen(5555, () => {
        console.log('Example app listening on port 5555!')
    })

    io = socket(server)

    io.on("connection",function(socket){
        socket.on('answer', async function (msg) { //get only answer id
            socket.requestTime = Date.now()

            let rawCookies = socket.handshake.headers.cookie
            let cookies = cookie.parse(rawCookies)

            let question = await models.QuizQuestion.findOne({
                where: {
                    quizId: msg.quizId,
                    questionId: msg.questionId,
                    countDownStart:{
                        [Op.not]: null
                    }
                }
            })

            if (question == null){
                return
            }

            //if answer is late
            if ( (question.countDownStart.getSeconds() + 7) < socket.requestTime.getSeconds()){
                return
            }

            socket.clientID = await getUserID(cookies.token)

            await models.QuizAnswer.create({
                answerTime: socket.requestTime,
                userId: socket.ClientId,
                questionId: msg.questionId,
                questionAnswerId : msg.answerId
            })

        });

        socket.on('first',async function(msg) {
            socket.emit('')
        })

        console.log("Socket connection established");
    })

})