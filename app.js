const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

var mongoDB = 'mongodb://127.0.0.1/todolistDB';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology:true, useFindAndModify: false });

const app = express();

var Schema = mongoose.Schema;
const taskSchema = new Schema({
        name: String,
});
const Task = mongoose.model('Task', taskSchema);

var listSchema = new Schema({
    name : String,
    items : [taskSchema]
});

const List = mongoose.model('List', listSchema);

const buy = new Task({
    name : "Welcome to new to-do list"
});

const cook = new Task({
    name : "click + button to ad an item"
});

const eat = new Task({
    name : "<--- click here to delete an item"
});

const defaultItems = [buy,cook,eat];

app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));

app.get('/',function(req, res){
    var day = date.getDay();

    Task.find(function(err, tasks){
        if(tasks.length == 0){
            Task.insertMany(defaultItems, function(err){
                if(err)
                    console.log(err);
                else{
                    console.log("Succesfully logged default items");
                }
            });
            res.redirect('/');
        }else{
            res.render("list",{listTitle: day, newItems: tasks});
        } 
    });
});

app.post('/',function(req, res){
    var listItem = req.body.item;
    var listName = req.body.list;

    const item = new Task({
        name : listItem
    });

    let day =  date.getDay();

    if(listName.slice(0,3) === day.slice(0,3)){
        item.save();
        res.redirect('/');
    }else{
        List.findOne({name : listName}, function(err, foundList){
            if(!err){
                foundList.items.push(item);
                foundList.save();
                res.redirect("/"+listName);
            }
        });
    }  
});

app.post('/delete',function(req, res){
   const checkedItemId = req.body.checkbox;
   const listName = req.body.listName;
   let day =  date.getDay();

   if(listName.slice(0,3) === day.slice(0,3)){
    
    Task.findByIdAndRemove(checkedItemId,function(err){
            if(!err){
                console.log("Item deleted");
                res.redirect('/');
            }
        });
    }else{
        List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : checkedItemId}}}, function(err, foundList){
                if(!err){
                    res.redirect('/' + listName)
                }
        });
    } 
});

app.get("/:customList",function(req, res){
    const customList = _.capitalize(req.params.customList);

    List.findOne({name : customList},function(err, foundList){
            if(!err){
                if(!foundList){
                    const newList = new List({
                        name : customList,
                        items : defaultItems
                    });
                    newList.save();
                    res.redirect("/"+ customList);
                }else{
                    res.render("list",{listTitle : foundList.name, newItems: foundList.items});
                }
            }
    });
    
});

app.listen(3000,function(){
    console.log("server is on 3000");
});