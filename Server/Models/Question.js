'use strict';

module.exports= (sequelize, DataTypes) => {
    const Question = sequelize.define('Question',
        {
            condition: DataTypes.STRING,
            points: DataTypes.INTEGER
        }
    )

    Question.associate = (models) => {
        models.Question.belongsToMany(models.Quiz, { through: models.QuizQuestion })
        models.Question.Answers = models.Question.hasMany(models.QuestionAnswer)
    }

    return Question
}