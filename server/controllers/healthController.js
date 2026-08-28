const getHealth = (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Faculty Feedback System API is running'
  });
};

module.exports = {
  getHealth
};
