'use strict';

module.exports = (sequelize, DataTypes) => {
    const Quiz = sequelize.define('Quiz',{
        GameStatus : DataTypes.STRING
    })

    Quiz.associate = (models) => {
        models.Quiz.belongsToMany(models.User,{as: 'userID', through: 'QuizMembers'})
        models.Quiz.belongsTo(models.User)
    }

    return Quiz;
}
