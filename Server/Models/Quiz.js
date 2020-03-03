'use strict';

module.exports = (sequelize, DataTypes) => {
    const Quiz = sequelize.define('Quiz',{
            GameStatus : DataTypes.INTEGER,
            MaxQuestions: DataTypes.INTEGER
        }
    )

    Quiz.associate = (models) => {
        models.Quiz.belongsToMany(models.User, { through: models.QuizUser })
        models.Quiz.belongsToMany(models.Question, { through: models.QuizQuestion })
        models.Quiz.belongsTo(models.User, {as: 'GameMaster'})
    }

    return Quiz;
}
