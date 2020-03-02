'use strict';

module.exports= (sequelize, DataTypes) => {
    const User = sequelize.define('User',
        {
            FirstName: DataTypes.STRING,
            LastName: DataTypes.STRING,
            PrivateID: DataTypes.STRING,
            Password: DataTypes.STRING,
        },
        {
            indexes: [
                {
                    unique: true,
                    fields: ['PrivateID']
                }
            ]
        }
    )

    User.assosiacte = (models) => {
        models.User.hasMany(models.Quiz)
        models.User.hasMany(models.QuizQuestion)
        models.User.belongsToMany(models.Quiz, { through: models.QuizUser })
    }
    
    return User;
}