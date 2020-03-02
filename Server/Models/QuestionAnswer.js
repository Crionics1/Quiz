'use strict';

module.exports= (sequelize, DataTypes) => {
    const QuestionAnswer = sequelize.define('QuestionAnswer',
        {
            Answer: DataTypes.STRING,
            IsTrue: DataTypes.BOOLEAN
        })

    QuestionAnswer.associate = (models) => {
        models.QuestionAnswer.belongsTo(models.Question)
        models.QuestionAnswer.belongsToMany(models.QuizQuestion,{ through: models.QuizQuestionAnswer})
        models.QuestionAnswer.belongsToMany(models.QuizUser,{ through: models.QuizQuestionAnswer})
    }

    return QuestionAnswer
}
