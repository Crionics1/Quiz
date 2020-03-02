'use strict';

module.exports = (sequelize, DataTypes) => {
    const QuizQuestion = sequelize.define('QuizQuestion')

    QuizQuestion.associate = (models) => {
        models.QuizQuestion.belongsTo( models.User ,{as: 'Author'})
        models.QuizQuestion.belongsToMany( models.QuizUser, {through: models.QuizQuestionAnswer})
        models.QuizQuestion.belongsToMany( models.QuestionAnswer, {through: models.QuizQuestionAnswer} )
    }

    return QuizQuestion;
}
