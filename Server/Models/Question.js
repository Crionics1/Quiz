'use strict';

module.exports= (sequelize, DataTypes) => {
    const Question = sequelize.define('Question',
        {
            condition: DataTypes.STRING,
            points: DataTypes.INTEGER,
            isCustom: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            }
        }
    )

    Question.associate = (models) => {
        models.Question.belongsToMany(models.Quiz,{through: models.QuizQuestion, foreignKey: 'questionId'})
        models.Question.hasMany(models.QuizQuestion,{foreignKey: 'questionId'})

        models.Question.Answers = models.Question.hasMany(models.QuestionAnswer, {foreignKey: 'questionId'})
    }

    return Question
}