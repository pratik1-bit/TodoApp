const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb//localhost:27017/todoListDB",{useNewUrlParser:true, useUnifiedTopology:true});
const itemSchema = new mongoose.Schema(
    {
        name: {
                type:String,
                required:true
              }
    });

const Item = mongoose.model("Item",itemSchema);

const item1 = new Item(
    {
        name: "Welcome to your To Do List"
    });

const item2 = new Item(
    {
        name: "Hit + to Add an item"
    });
    
const item3 = new Item(
    {
        name: "<--Hit here to delete an item"
    });    

const defaultItems = [item1,item2,item3];

app.get("/",function(req,res){
        Item.find({},function(err,results) {
           if (results.length === 0) {
               Item.insertMany(defaultItems,function(err){
                   if (err) {
                       console.log(err);
                   } else {
                       console.log("Successfully inserted default items");
                   }
               });
               res.redirect("/");
           } else {
               res.render("list",{listType:"Today",newlistItems:results});                   
           }
        }    
)});

const ListSchema = new mongoose.Schema(
    {
        name:{
                type: String,
                required: true
             },
        items: [itemSchema]     
    });

const List = mongoose.model("List",ListSchema);    

app.get("/:customListName",function(req,res) {

   const customlistName = _.capitalize(req.params.customListName);
   List.findOne({name:customlistName},function(err,result){
       if (!result) {
            const list = new List({
                name: customlistName,
                items: defaultItems 
            });
            list.save();
            res.redirect("/"+customlistName);         
       } else {
            res.render("list",{listType:result.name, newlistItems:result.items});
       }
   }); 

       
});

app.get("/about",function(req,res){
    res.render("about");
});

app.post("/",function(req,res){
   const itemName = req.body.newItem;
   const listName = req.body.list;
   const newDBItem = new Item(
                    {
                        name:itemName
                    });
   if (listName == "Today") {
    newDBItem.save();
    res.redirect("/");
   } else {
       List.findOne({name:listName},function(err,foundList) {
           foundList.items.push(newDBItem);
           foundList.save();
           res.redirect("/"+listName); 
       });
   }
                 
}   
)

app.post("/delete",function(req,res){
     const checkedItem = req.body.itemcheck;
     const listname = req.body.listname;
     if (listname ==="Today") {
        Item.findByIdAndRemove(checkedItem,function(err){
            if (err)
            {
               console.log(err);   
            }
            else
            {
               console.log("Successfully deleted the item");
               res.redirect("/"+listname);
            }
        })
     } else {
        List.findOneAndUpdate({name:listname},{$pull:{items:{_id:checkedItem}}},function(err) {
            if (!err) {
                res.redirect("/"+listname);
            }
        });
     }
});

app.get("/work",function(req,res){
    res.render("list",{listType:"Work List", newlistItems: workItems});
});

app.listen(process.env.PORT,function(){
    console.log("Server listening on port 3000");
});