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
        models.QuizQuestion.hasMany(models.QuizAnswer)
    }

    return QuizQuestion;
}
