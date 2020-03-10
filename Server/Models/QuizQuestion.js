'use strict';

module.exports = (sequelize, DataTypes) => {
    const QuizQuestion = sequelize.define('QuizQuestion', {
        Id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        tour: DataTypes.INTEGER,
        countDownStart: DataTypes.DATE
    })

    QuizQuestion.associate = (models) => {
        models.QuizQuestion.belongsTo(models.Quiz,{foreignKey:'quizId'})
        models.QuizQuestion.belongsTo(models.Question,{foreignKey:'questionId'})
    }

    return QuizQuestion;
}
