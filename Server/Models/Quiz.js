'use strict';

module.exports = (sequelize, DataTypes) => {
    const Quiz = sequelize.define('Quiz',{
            gameStatus : DataTypes.INTEGER
        }
    )

    Quiz.associate = (models) => {
        models.Quiz.hasMany(models.QuizAnswer,{foreignKey: 'quizId'})

        models.Quiz.Questions = models.Quiz.belongsToMany(models.Question,{through: models.QuizQuestion, foreignKey: 'quizId'})
        models.Quiz.QuizQuestions = models.Quiz.hasMany(models.QuizQuestion,{foreignKey:'quizId'})

        models.Quiz.Admin = models.Quiz.belongsTo(models.User, {foreignKey: 'adminId'})

        models.Quiz.belongsToMany(models.User,{through: models.QuizUser, foreignKey:'quizId'})
        models.Quiz.hasMany(models.QuizUser,{foreignKey: 'quizId'})
    }

    return Quiz;
}