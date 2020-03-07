'use strict';

module.exports = (sequelize, DataTypes) => {
    const QuizQuestion = sequelize.define('QuizQuestion', {
        Id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        }
    })

    QuizQuestion.associate = (models) => {
        models.QuizQuestion.hasMany(models.QuizAnswer,{foreignKey:'quizQuestionId'})
        models.QuizQuestion.belongsTo(models.Quiz,{foreignKey:'quizId'})
        models.QuizQuestion.belongsTo(models.Question,{foreignKey:'questionId'})
    }

    return QuizQuestion;
}
