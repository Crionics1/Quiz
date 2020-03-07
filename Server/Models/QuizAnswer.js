'use strict';

module.exports = (sequelize, DataTypes) => {
    const QuizAnswer = sequelize.define('QuizAnswer',{
        ID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        AnswerTime: DataTypes.DATE,
        Points: DataTypes.INTEGER
    })

    QuizAnswer.associate = (models) => {
        models.QuizAnswer.belongsTo(models.QuizUser, {foreignKey: 'quizUserId'})
        models.QuizAnswer.belongsTo(models.QuizQuestion, {foreignKey: 'quizQuestionId'})
        models.QuizAnswer.belongsTo(models.QuestionAnswer, {foreignKey: 'quizAnswerId'})
    }

    return QuizAnswer
}