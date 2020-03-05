'use strict';

module.exports = (sequelize, DataTypes) => {
    const Quiz = sequelize.define('Quiz',{
            gameStatus : DataTypes.INTEGER
        }
    )

    Quiz.associate = (models) => {
        models.Quiz.belongsToMany(models.User, { through: models.QuizUser })
        models.Quiz.Questions = models.Quiz.belongsToMany(models.Question, { through: models.QuizQuestion })
        models.Quiz.User = models.Quiz.belongsTo(models.User)
        models.Quiz.QuizQuestion = models.Quiz.hasMany(models.QuizQuestion)
    }

    return Quiz;
}