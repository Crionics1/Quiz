const express = require('express')
const db = require('sequelize')

const app = express()


//<editor-fold desc="Models">

const QuizQuestionAnswer = connection.define('QuizQuestionAnswer',{
    AnswerTime: Sequelize.DATE
})

QuizUser.hasOne(Quiz)
QuizUser.hasMany(User)

Question.hasMany(QuestionAnswer)

QuizQuestion.hasMany(QuizQuestion)
QuizQuestion.hasOne(Quiz)

QuizQuestionAnswer.hasOne(User)

//</editor-fold>

connection.sync({
    force: true
}).then(() => {
    app.listen(8000, () => {
        console.log('Example app listening on port 8000!')
    })
})


