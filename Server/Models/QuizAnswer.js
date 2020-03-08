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
        models.QuizAnswer.belongsTo(models.User, {foreignKey: 'userId'})
        models.QuizAnswer.belongsTo(models.Question, {foreignKey: 'questionId'})
        models.QuizAnswer.belongsTo(models.QuestionAnswer, {foreignKey: 'questionAnswerId'})
    }

    return QuizAnswer
}