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


app.get('/quizlist', function(req,res){
    res.render('gameList')
})

app.get('/quiz/:quizId', async function(req,res){
    try{
        let quiz = await models.Quiz.findByPk(req.params.quizId)
        res.render('game', {quizId: quiz.id})
    }catch(error){
        res.sendStatus(404);
    }
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
            let user = await models.User.findOne({where: {privateID: req.body.privateId, password: req.body.password}})
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

app.get('/quiz', async function(req,res){
    let quizzes = await models.Quiz.findAll({
        where: {gameStatus: 1},
        attributes: ['id', 'adminId']
    })

    res.send(JSON.stringify(quizzes, null, 2))
})

app.post('/r/joinquiz',async function(req,res){
    let quiz = await models.Quiz.findOne({where:{id: req.query.quizid, gameStatus: 1}})

    if(quiz == null){
        res.sendStatus(404);
        return
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

        startQuiz(quiz.id)

        res.sendStatus(200)
    }catch(error){
        res.sendStatus(500)
    }
})

app.get('/quizmembers', async function(req,res){
    let quiz = await models.Quiz.findByPk(req.query.quizid,
        {
        include:[{
            model: models.QuizUser,
            include: [{
                model: models.User,
                attributes: ["firstname","lastname","id"]
            }]
        }]
    });

    let users = [];
    let i;
    for (i = 0; i< quiz.Users.length; i++){
        users[i] = quiz.Users[i];
    }

    res.send(JSON.stringify(users,null,2))
})

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
    await models.User.bulkCreate([
        {
            firstName: 'luka',
            lastName: 'turmanidze',
            privateID: 'user1',
            password: '123'
        },{
            firstName: 'user',
            lastName: 'useradze',
            privateID: 'user2',
            password: '123'
        }
    ])

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

    models.Question.findAndCountAll({
        include:[{
            model: models.QuestionAnswer
        }]
    })
        .then(q =>
            console.log(JSON.stringify(q,null,2))
        )


    const server = app.listen(5555, () => {
        console.log('Example app listening on port 5555!')
    })

    io = socket(server)

    io.use(async function(socket,next){
        let rawCookies = socket.handshake.headers.cookie
        let cookies = cookie.parse(rawCookies)


        socket.requestTime = Date.now()
        socket.clientID = await getUserID(cookies.token)

        if (socket.clientID == null){
            return
        }

        next()
    })

    var socketUsers = []
    io.on("connection",function(socket){

        socket.on('joinQuiz', async function (msg) {
            // check if user belongs to quiz
            /*
            let quiz = await models.Quiz.findOne({
                where: {
                    id: msg.quizId,
                    gameStatus:{
                        $or:[1,2]
                    }
                },
                include: {
                    model: models.QuizUser,
                    where: {
                        userId: socket.clientID,
                    }
                }
            })

            if (user == null){
                return
            }*/

            socket.join(msg.quizId)
        });

        socketUsers.push({clientId: socket.clientId, socketId: socket.id})
        console.log("Socket connection established");
    })

})

async function startQuiz(quizId){
    gameControllers[quizId]={}
    //EAGER LOADING MANY TO MANY
    gameControllers[quizId].questions = await models.Question.findAll({
        include: {
            model: models.Quiz,
            where: {
                id: quizId
            }
        },
        order:[['isCustom']]
    })
    gameControllers[quizId].quizQuestions = await models.QuizQuestion.findAll({
        where: {
            quizId: quizId
        }
    })
    gameControllers[quizId].index = 0
    gameControllers[quizId].initTimeout = setTimeout(async () => {
        if (gameControllers[quizId].index == gameControllers[quizId].questions.length){
            let quiz = await models.Quiz.findByPk(quizId);
            quiz.gameStatus = 3
            await quiz.save()

            clearTimeout(gameControllers[quizId].timeout)
        }


        let date = Date.now()
        date = new Date(date + 5)

        let currentQuestion = gameControllers[quizId].questions[[gameControllers[quizId].index]]
        let currentQuizQuestion = gameControllers[quizId].quizQuestions[[gameControllers[quizId].index]]
        //set current question's countdown
        currentQuizQuestion.countDownStart = date
        await currentQuizQuestion.save()

        //TODO: send question to users
        io.in(quizId).emit('question', JSON.stringify(currentQuestion));

        //if no more questions are left end timeout, and set game status to ended

        // Prepare for next Question, increment question index
        gameControllers[quizId].index++

        //continue timeout if next question is not custom
        if (currentQuestion.isCustom == false){
            gameControllers[quizId].initTimeout(quizId)
        }

    },10000)
}

var gameControllers = []