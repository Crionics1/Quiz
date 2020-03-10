'use strict';

module.exports = (sequelize, DataTypes) => {
    //class User extends sequelize.Model{}
    const User = sequelize.define('User',
        {
            firstName:{
                type: DataTypes.STRING,
                allowNull: false
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            privateID: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            }
        }
    )

    User.associate = (models) => {
        models.User.Quizzes = models.User.hasMany(models.Quiz, {foreignKey: 'adminId'})

        models.User.hasMany(models.QuizAnswer,{foreignKey: 'userId'})
        models.User.hasMany(models.Session, {foreignKey: 'userId'})

        models.User.belongsToMany(models.Quiz,{through: models.QuizUser, foreignKey:'userId'})
        models.User.hasMany(models.QuizUser,{foreignKey: 'userId'})
    }
    
    return User;
}