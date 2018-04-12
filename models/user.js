var mongoose = require('./../mongo');

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String
});
//这里会数据库会创建一个users集合
var User = mongoose.model('User', UserSchema);
module.exports = User;