'use strict';

module.exports= (sequelize, DataTypes) => {
    const QuestionAnswer = sequelize.define('QuestionAnswer',
        {
            Answer: DataTypes.STRING,
            IsTrue: DataTypes.BOOLEAN
        })

    return QuestionAnswer
}
