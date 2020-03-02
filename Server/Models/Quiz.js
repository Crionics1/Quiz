'use strict';

module.exports = (sequelize, DataTypes) => {
    const Quiz = sequelize.define('Quiz',{
        GameStatus : DataTypes.STRING
        }
    )

    Quiz.associate = (models) => {
        models.Quiz.belongsToMany(models.User, { through: models.QuizUser })
        models.Quiz.belongsToMany(models.Question, { through: models.QuizQuestion })
        models.Quiz.belongsTo(models.User, {as: 'Author'})
    }

    return Quiz;
}
