module.exports = (req, res, next) => {
  throw new res.BadRequest();
};