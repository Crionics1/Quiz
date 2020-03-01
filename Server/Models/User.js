'use strict';

module.exports=(sequelize, DataTypes) => {
    const User = connection.define('User',
        {
            FirstName: DataTypes.STRING,
            LastName: DataTypes.STRING,
            PrivateID: DataTypes.STRING,
            Password: DataTypes.STRING,
        })
    return User;
}