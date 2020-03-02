'use strict';

module.exports= (sequelize, DataTypes) => {
    const Question = sequelize.define('Question',
        {
            Condition: DataTypes.STRING,
            Points: DataTypes.INTEGER
        }
    )

    Question.associate = (models) => {
        models.Question.belongsToMany(models.Quiz, { through: models.QuizQuestion })
        models.Question.hasMany(models.QuestionAnswer)
    }

    return Question
}