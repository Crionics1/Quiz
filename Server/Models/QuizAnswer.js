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
        models.QuizAnswer.belongsTo(models.QuizUser)
        models.QuizAnswer.belongsTo(models.QuizQuestion)
        models.QuizAnswer.belongsTo(models.QuestionAnswer)
    }

    return QuizAnswer
}