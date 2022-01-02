//jshint esversion:6
// for version 3 of to-do-list app, I want to make the following improvements:
// 1. when you check an item as done on the list, it goes into a separate
//    box below of checked items, with text crossed out, basically like
//    google note app does
//      idea - add a field to database items that tracks checked: yes, no
//      also, may want to add a way to permanently delete checked item?
//        could start with just one button below the checked list that when clicked
//        will delete all items "checked: yes" in the db
// 2. change the CSS so site is more mobile-friendly

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// create a new database with mongoose
// mongoose.connect("mongodb://localhost:27017/todolistDB");

// how we connect to database (and create if not existing) in mongoDB atlas
// check database in cloud.mongodb.com under Collections in Cluster0
mongoose.connect("mongodb+srv://admin-deanna:test123@cluster0.n4c7p.mongodb.net/todoListDB");
// mongodb+srv://admin-deanna:<password>@cluster0.n4c7p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to the to-do list"
});
const item2 = new Item({
  name: "Press the + button to add a new item"
});
const item3 = new Item({
  name: "<---- Check this to delete an item"
});

const defaultItems = [item1, item2, item3]; // item4, item5, item6];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log("Error");
        } else {
          console.log("Successfully added default items to DB");
        }
      });
      res.redirect("/");
    } else {
      // console.log(foundResults);
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });

});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  // console.log(req.body.checkbox);
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    // this mongoose function requires the callback function to execute deletion
    //  otherwise just returns the query
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (!err) {
        console.log("Successfully removed checked item from database");
        res.redirect("/");
      }
    });
  } else {
      // List.findOneAndUpdate( what conditions, what to update, callback function )
    List.findOneAndUpdate(
      { name: listName},
      { $pull: { items: { _id: checkedItemID } } },
      function(err, foundList){
        if(!err){
          res.redirect("/" + listName);
        }
    });
  }



});

app.get("/:customListName", function(req, res) {

  const listName = _.capitalize(req.params.customListName);
  console.log("User wants to make list with name:  " + listName);

  List.findOne({
    name: listName
  }, function(err, foundList) {
    if (!err) {
      if (foundList !== null) {
        console.log("list already exists for:  " + listName);
        // open page for existing list
        // res.render("list");
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      } else {
        // create a new list and render
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        console.log("new list created for:  " + listName);
        res.redirect("/" + listName);
      }
    }
  });
});


app.get("/about", function(req, res) {
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});

// code from app.post("/")
// item.save();
// // why doesn't this work?
// Item.insertOne(item, function(err) {
//     if (err) {
//       console.log("error");
//     } else {
//       console.log("successfully added new to-do list item");
//     }
//   });
// res.redirect("/");
// }

// const item4 = new Item ({
//   name: "Study 1 hour of Udemy web dev bootcamp"
// });
// const item5 = new Item ({
//   name: "Read 1 hour of MDN web documents or other technical reading"
// });
// const item6 = new Item ({
//   name: "Spend 30 minutes actively doing web dev in Atom on own"
// });

// Study 1 hour of Udemy web dev bootcamp
// Read 1 hour of MDN web documents or other technical reading
// Spend 30 minutes actively doing web dev in Atom on own


// app.get("/work", function(req, res) {
//   res.render("list", {
//     listTitle: "Work List",
//     newListItems: workItems
//   });
// });
