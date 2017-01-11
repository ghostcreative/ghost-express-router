const ValidateFunc = {

  execute: (creds, assignedPermissions) => {
    return this._db.permission.findAll({
      where: {
        name: { $in: [assignedPermissions] }
      },
      include: [
        { model: this._db.role, where: { name: req.creds.role }, required: true },
        { model: this._db.modelScope }
      ]
    })
    .then(permissions => {
      if (_.isEmpty(permissions)) throw new Error(`Missing permissions. One of the following required: ${assignedPermissions.toString()}`);
      return permissions;
    })
  },

  registerDb: (db) => {
    this._db = db;
  }

};

module.exports = ValidateFunc;