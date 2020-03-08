'use strict';

module.exports= (sequelize, DataTypes) => {
    const QuizUser = sequelize.define('QuizUser',{
        Id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        }
    })

    QuizUser.assosiacte = (models) => {
        models.QuizUser.User = models.QuizUser.belongsTo(models.User,{foreignKey: 'userId'})
        models.QuizUser.Quiz = models.QuizUser.belongsTo(models.Quiz,{foreignKey: 'quizId'})
    }
    
    return QuizUser;
}