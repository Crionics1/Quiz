'use strict';

module.exports= (sequelize, DataTypes) => {
    const QuestionAnswer = sequelize.define('QuestionAnswer', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        answer: DataTypes.STRING,
        isTrue: DataTypes.BOOLEAN
    })

    QuestionAnswer.associate = (models) => {
        models.QuestionAnswer.Question = models.QuestionAnswer.belongsTo(models.Question, {foreignKey: 'questionId'})
        models.QuestionAnswer.hasMany(models.QuizAnswer,{foreignKey:'questionAnswerId'})
    }

    return QuestionAnswer
}
