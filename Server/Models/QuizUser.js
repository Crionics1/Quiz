'use strict';

module.exports= (sequelize, DataTypes) => {
    const QuizUser = sequelize.define('QuizUser')

    QuizUser.assosiacte = (models) => {
        models.QuizUser.belongsToMany(models.QuizQuestion, {through: models.QuizQuestionAnswer})
        models.QuizUser.belongsToMany(models.QuestionAnswer, {through: models.QuizQuestionAnswer})
    }
    
    return QuizUser;
}