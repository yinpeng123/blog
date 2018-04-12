var mongoose = require('./../mongo');

var ArticleSchema = new mongoose.Schema({
    title:String,//标题
    author:String,//作者
    content:String,//文章内容
    publishTime:String,//发表时间
    artiImg:String,//封面
    comments:[{
        name:String,
        time:String,
        content:String
    }],//评论
    pv:Number//访问次数
});
//这里会数据库会创建一个articles集合
var Article = mongoose.model('Article', ArticleSchema);
module.exports = Article;