'use strict';

module.exports = (sequelize, DataTypes) => {
    const QuizAnswer = sequelize.define('QuizAnswer',{
        ID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        answerTime: DataTypes.DATE
    })

    QuizAnswer.associate = (models) => {
        models.QuizAnswer.belongsTo(models.User, {foreignKey: 'userId'})
        models.QuizAnswer.belongsTo(models.Quiz, {foreignKey: 'quizId'})
        models.QuizAnswer.belongsTo(models.Question, {foreignKey: 'questionId'})
        models.QuizAnswer.belongsTo(models.QuestionAnswer, {foreignKey: 'questionAnswerId'})
    }

    return QuizAnswer
}