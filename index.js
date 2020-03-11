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
        /*
        if (req.clientID == 1){
            res.render('gameForAdmin', {quizId: req.params.quizId,userId: req.clientID})
            return
        }
        for testing*/ 

        res.render('game', {quizId: req.params.quizId, userId: req.clientID})
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
        attributes: ['id']
    })

    res.send(JSON.stringify(quizzes, null, 2))
})


app.post('/startquiz/:quizId', async function(req,res) {
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

app.post('/nextQuestion/:quizId', async function(req,res){
    let quizQuestion = await models.QuizQuestion.findOne({
        order:['tour','id'],
        where: {
            quizId: req.params.quizId,
            countDownStart: null
        },
        include:{
            model:models.Question,
            attributes: ['isCustom','condition'],
            include: {
                model: models.QuestionAnswer,
                attributes: ['id', 'answer'],
                required: false
            }
        }
    })

    if(quizQuestion == null){
        io.emit('ended')
        res.sendStatus(404)
        return
    }

    let quizQuestionDTO = {
        isCustom: quizQuestion.Question.isCustom,
        questionId: quizQuestion.questionId,
        condition: quizQuestion.Question.condition,
        answers: quizQuestion.Question.QuestionAnswers,
        countDownStart: quizQuestion.countDownStart
    }

    quizQuestion.countDownStart = new Date(Date.now() + 5000)
    await quizQuestion.save()

    io.emit('question',quizQuestionDTO)

    res.sendStatus(200)
})

app.get('/quizmembers/:quizId', async function(req,res){
    let result = await db.sequelize.query(
        "select QU.userID, t.points\n" +
        "from QuizUsers as QU\n" +
        "left join \n" +
        "(\n" +
        "    select x.quizId, QA.userId, sum(x.points) as points\n" +
        "    from \n" +
        "    (\n" +
        "        select QA.quizId, QA.questionId, Q.points, min(QA.answerTime) as answerTime\n" +
        "        from QuizAnswers as QA\n" +
        "        inner join Questions as Q on QA.questionId = Q.id\n" +
        "        inner join QuestionAnswers as QTA on QTA.id = QA.questionAnswerId and QTA.isTrue = 1\n" +
        "        group by QA.quizId, QA.questionId, Q.points \n" +
        "    ) as X\n" +
        "\tinner join QuizAnswers QA on QA.quizID = X.quizId and QA.questionId = X.questionId and QA.answerTime = X.answerTime\n" +
        "    group by QA.quizId, QA.userId) \n" +
        "as T on T.userId = QU.userId and T.quizId = QU.quizId\n" +
        "where QU.quizID = $$quizId",
        {
            bind: {quizId: req.params.quizId},
            type: db.sequelize.QueryTypes.SELECT
        }
    )

    res.send(JSON.stringify(result,null,2))
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

    let questions = await models.Question.bulkCreate([
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


    console.log(JSON.stringify(questions,null,2))

    let quiz = await models.Quiz.create({
        gameStatus : 1,
        adminId: 1
    })

    await quiz.setUsers([1])

    let quizQuestions = []
    for (let i=0; i< questions.length; i++){
        quizQuestions[i] = {}
        quizQuestions[i].questionId = questions[i].id
        quizQuestions[i].quizId = 1
        quizQuestions[i].tour = 1
    }

    let createdQuizQuestionns = await models.QuizQuestion.bulkCreate(quizQuestions)
    console.log(createdQuizQuestionns,null,2)

    const server = app.listen(5555, () => {
        console.log('Example app listening on port 5555!')
    })

    io = socket(server)
    io.on("connection",function(socket){
        socket.on('answer', async function (msg) { //get only answer id
            socket.requestTime = Date.now()

            //let rawCookies = socket.handshake.headers.cookie
            //let cookies = cookie.parse(rawCookies)
            //socket.clientID = await getUserID(cookies.token)

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
                console.log("didnt find socket requested quiz questions")
                return
            }

            //if answer is late
            if ( (question.countDownStart.getSeconds() + 7) < socket.requestTime.getSeconds()){
                console.log("question countdown has ended")
                return
            }



            await models.QuizAnswer.create({
                answerTime: socket.requestTime,
                quizId: msg.quizId,
                userId: msg.userId,
                questionId: msg.questionId,
                questionAnswerId : msg.answerId
            }) //quiz,question,user should be unique(index)

        });

        socket.on('customAnswer',async function(msg) {
            socket.requestTime = Date.now()
            socket.emit('customAnswer', {userId: msg.userId, answerTime:socket.requestTime})
        })

        console.log("Socket connection established");
    })

})