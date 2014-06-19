
module.exports = function(data) {

  console.log("Calling hook twitter with ", data);
  require('./twitter')(data);

};
