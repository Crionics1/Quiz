'use strict';

module.exports = (sequelize, DataTypes) => {
    const Session = sequelize.define('Session', {
        Token: DataTypes.STRING
    })

    Session.associate = (models) => {
        models.Session.User = models.Session.belongsTo(models.User,{foreignKey: 'userId'})
    }

    return Session;
}
