'use strict';

module.exports = (sequelize, DataTypes) => {
    const QuizQuestionAnswer = sequelize.define('QuizQuestionAnswer',{
        AnswerTime: DataTypes.DATE
    })

    return QuizQuestionAnswer
}