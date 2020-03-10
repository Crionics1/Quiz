'use strict';

module.exports= (sequelize, DataTypes) => {
    const QuestionAnswer = sequelize.define('QuestionAnswer', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        isTrue: DataTypes.BOOLEAN
    })

    QuestionAnswer.associate = (models) => {
        models.QuestionAnswer.hasMany(models.QuizAnswer,
        {
            foreignKey: {
                name:'questionAnswerId',
                allowNull: true
            }
        })
        models.QuestionAnswer.Question = models.QuestionAnswer.belongsTo(models.Question, {foreignKey: 'questionId'})
    }

    return QuestionAnswer
}
