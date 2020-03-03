'use strict';

module.exports = (sequelize, DataTypes) => {
    const Session = sequelize.define('Session', {
        Token: DataTypes.STRING
    })

    Session.associate = (models) => {
        models.Session.belongsTo(models.User)
    }

    return Session;
}
