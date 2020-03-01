'use strict';

module.exports= (sequelize, DataTypes) => {
    const Question = sequelize.define('Question',
        {
            Condition: DataTypes.STRING,
            Points: DataTypes.INTEGER
        }
    )

    return Question
}