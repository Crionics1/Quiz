'use strict';

module.exports = (sequelize, DataTypes) => {
    const QuizQuestion = sequelize.define('QuizUser', {
        Id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        }
    })

    QuizQuestion.associate = (models) => {
        models.QuizUser.belongsTo(models.User,{foreignKey: 'userId'})
        models.QuizUser.belongsTo(models.Quiz,{foreignKey: 'quizId'})
    }

    return QuizQuestion;
}
