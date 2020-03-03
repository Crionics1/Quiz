'use strict';

module.exports= (sequelize, DataTypes) => {
    const User = sequelize.define('User',
        {
            FirstName:{
                type: DataTypes.STRING,
                allowNull: false
            },
            LastName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            PrivateID: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            Password: {
                type: DataTypes.STRING,
                allowNull: false
            },
        }
    )

    User.assosiacte = (models) => {
        models.User.hasMany(models.Quiz)
        models.User.belongsToMany(models.Quiz, { through: models.QuizUser })
        models.User.hasMany(models.Session)
    }
    
    return User;
}