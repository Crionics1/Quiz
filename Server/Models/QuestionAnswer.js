'use strict';

module.exports= (sequelize, DataTypes) => {
    const QuestionAnswer = sequelize.define('QuestionAnswer', {
        Id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Answer: DataTypes.STRING,
        IsTrue: DataTypes.BOOLEAN
    })

    QuestionAnswer.associate = (models) => {
        models.QuestionAnswer.belongsTo(models.Question)
        models.QuestionAnswer.hasMany(models.QuizAnswer)
    }

    return QuestionAnswer
}
