var mongoose = require('mongoose');
var config = require('./config/config');

mongoose.Promise = global.Promise;
mongoose.connect(config.mongodb,{useMongoClient:true});

/**
  * 连接成功
  */
  mongoose.connection.on('connected', function () {    
    console.log('Mongoose connection open to ' + config.mongodb);  
});    

/**
 * 连接异常
 */
mongoose.connection.on('error',function (err) {    
    console.log('Mongoose connection error: ' + err);  
});    
 
/**
 * 连接断开
 */
mongoose.connection.on('disconnected', function () {    
    console.log('Mongoose connection disconnected');  
});    

module.exports = mongoose;