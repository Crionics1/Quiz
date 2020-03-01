'use strict';

module.exports = (sequelize, DataTypes) => {
    const QuizUser = sequelize.define('QuizUser',
        {
            Points: DataTypes.INTEGER
        }
    )

    return QuizUser
}
