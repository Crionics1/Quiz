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
        models.QuizUser.belongsTo(models.Quiz)
        models.QuizUser.belongsTo(models.User)
        models.QuizUser.hasMany( models.QuizAnswer)
    }
    
    return QuizUser;
}