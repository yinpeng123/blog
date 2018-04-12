var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var markdown = require('markdown').markdown;
var path = require("path")
var User = require('./../models/user');
var Article = require('./../models/article');
var moment = require('moment');//时间控件
var formidable = require('formidable');//表单控件

 //检测是否登录
 function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','未登录，请您先登录');
        return res.redirect('/');
    }
   next();
}
function checkNoLogin(req,res,next){
   if(req.session.user){
       req.flash('error','已登录，无需再登录');
       return res.redirect('back');
   }
   next();
}

router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
    Article.find(function(err,data){
        if (err) {
            console.log(err)
        }
        res.render('index', { 
            title: '首页',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString(),
            articles: data,
            time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        });
    })  
});

//注册界面
router.get('/reg', function(req, res, next) {
    res.render('reg', { title: '注册' });
});

router.post('/reg', function(req, res, next) {
    var user = new User({
        username:req.body.username,
        password:req.body.password,
        email:req.body.email
    });
    if(req.body['password']!=req.body['password-repeat']){
        req.flash('两次输入的密码不一致');
        console.log('两次输入的密码不一致');
        return res.redirect('/reg');
    }
    User.findOne({'username':user.username},function(err,data){
        if(err){
            req.flash('err',err);
            console.log('err: '+err);
            return res.redirect('/reg');
        }
        if(data!=null){
            req.flash('用户已存在');
            console.log('用户已存在');
            return res.redirect('/reg');
        }else{
             user.save(function(err){
                 if(err){
                     req.flash('err',err);
                     console.log('err: '+err);
                     return res.redirect('/reg');
                  }
                 req.flash('注册成功!');
                 console.log('注册成功!');
                 res.redirect('/');
             })
         }
    })
});

//登录
router.get('/login',checkNoLogin, function(req, res, next) {
    res.render('login', { title: '登录' });
});

router.post('/login',checkNoLogin, function(req, res, next) {
    var password = req.body.password;
    //检查用户是否存在
    User.findOne({'username':req.body.username},function(err,user){
        if(err){
            console.log('error','err');
            req.flash('error','登录出错');
            return res.redirect('/');
        }
        //用户不存在
        if(!user){
            console.log('error','用户不存在');
            req.flash('error','用户不存在');
            return res.redirect('/login');
        }
        //判断密码是否一致
        if(user.password != password){
            console.log('error','密码错误');
            req.flash('error','密码错误');
            return res.redirect('/');
        }
            req.session.user = user;
            console.log(user.username);
            req.flash('success','登录成功');
            res.redirect('/');     
    });
});

//发表文章
router.get('/post',checkLogin, function(req, res, next) {
    res.render('post', { 
        title: '发表文章' ,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/post',checkLogin, function(req, res, next) {
    var imgPath = './public/images/';
    var form = new formidable.IncomingForm(); //创建上传表单
    form.encoding = 'utf-8'; //设置编辑
    form.uploadDir = imgPath; //设置上传目录
    form.keepExtensions = true; //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
    form.type = true;
    form.parse(req, function(err, fields, files) {
        if (err) {
            console.log(err);
            req.flash('error','图片上传失败');
            return;
        }
        var file = files.artiImg;//获取上传文件信息

        if(file.type != 'image/png' && file.type != 'image/jpeg' && file.type != 'image/gif' && file.type != 'image/jpg'){
            console.log('上传文件格式错误，只支持png,jpeg,gif');
            req.flash('error','上传文件格式错误，只支持png,jpeg,gif');
            return res.redirect('/upload');
        }
        var title = fields.title;
        var author = req.session.user.username;
        var content = fields.content;
        var artiImg = file.path.split(path.sep).pop();
        var pv = fields.pv;
        // 校验参数
        try {
            if (!title.length) {
                throw new Error('请填写标题');
            }
            if (!content.length) {
                throw new Error('请填写内容');
            }
        } catch (e) {
            req.flash('error', e.message);
            return res.redirect('back');
        }
        var article = new Article({
            title:title,
            author:author,
            content:content,
            artiImg:artiImg,
            publishTime:moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString(),
            pv:pv
        });
        article.save(function(err){
            if(err){
                console.log('文章发表出现错误');
                req.flash('err','文章发表出现错误');
                return res.redirect('/post');
            }
            console.log('文章录入成功');
            req.flash('success','文章录入成功');
            res.redirect('/');
        });
    });
});

//展示文章
router.get('/detail', function(req,res,next){
    var id = req.query.id;
    if(id && id!=''){
        Article.update({"_id":id},{$inc:{"pv":1}},function(err){
            if(err){
                console.log(err);
                return res.redirect("back");
            };
            console.log("浏览数量+1");
        });

        Article.findById(id,function(err,data){
            if(err){
                console.log(err);
                req.flash('error','查看文章详细信息出错');
                return res.redirect('/');
            }
            res.render('detail',{
                title:'文章展示',
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString(),
                article:data,
                img:'/images/'+data.artiImg
            })
        });
    }
});

//编辑文件
router.get('/edit',checkLogin, function (req, res) {
    var id = req.query.id;
    Article.findById(id, function (err, data) {
        //console.log(data);
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        res.render('edit', {
            title: '编辑',
            article: data,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});
 router.post("/edit",checkLogin,function(req,res,next){
    var article = {
        _id:req.body.id,
        author:req.session.user,
        title:req.body.title,
        content:req.body.content,
        publishTime:moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString(),
    };

    console.log(article);

    //markdow转格式文章
    article.content = markdown.toHTML(article.content);


    Article.update({"_id":article._id},{$set:{title:article.title, content:article.content, publishTime:article.publishTime}},function(err){
        if(err){
            console.log(err);
            return;
        }
        console.log("更新成功");
        res.redirect("/");
    });
});

//删除文件
router.get('/delete',checkLogin,function(req,res){
    var id = req.query.id;
    console.log(id);
    if(id && id!=''){
        Article.findByIdAndRemove(id,function(err){
            if(err){
                console.log(err);
                req.flash("success","删除文章失败");
                return req.redirect('/')
            }
            req.flash("success","删除文章成功");
            res.redirect('/');
        })
    }
});

//退出登录
router.get('/logout',checkLogin, function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功!');
    res.redirect('/');//登出成功后跳转到主页
});

module.exports = router;