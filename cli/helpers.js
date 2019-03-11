'use strict';

const mergeDB = (existingDB, updatedDB) => {
  // We merge the existing translations with the new updated database.
  return Object.keys(updatedDB).reduce((obj, key) => {
    obj[key] = { ...existingDB[key], ...updatedDB[key]}
    return obj;
  }, {});
};

module.exports = {
  mergeDB
};
