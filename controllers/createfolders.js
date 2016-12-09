/**
 * @description - checks the directory location, if the directory doesn't exit 
 * then it creates that directory in that same.
 */

var checkDir,
	fs;

fs = require('fs');

checkDir = function(){
  var _path = arguments;
  if(_path.length === 1) {

    if(!fs.existsSync(_path[0]))
      fs.mkdirSync(_path[0]);

  } else {

    for(var i=0; i<_path.length; i++)
      checkDir(_path[i]);
  }  
};

module.exports = checkDir;
