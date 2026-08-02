'use strict';
const { DataTypes } = require('sequelize');

/**
 * Role Model
 * Stores name and dynamic JSON permission matrix for each role.
 */
module.exports = (sequelize) => {
    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: {
                msg: 'Role name must be unique'
            }
        },
        permissions: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '{}' // Stores stringified JSON mapping of permission keys to booleans
        }
    }, {
        tableName: 'Roles',
        timestamps: true
    });

    return Role;
};
