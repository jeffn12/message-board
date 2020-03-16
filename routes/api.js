/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var shortid = require("shortid");

module.exports = function(app, db) {
  app
    .route("/api/threads/:board")

    //I can GET an array of the most recent 10 bumped threads on the board with only the most recent 3 replies
    //   from /api/threads/{board}. The reported and delete_passwords fields will not be sent.
    .get((req, res) => {
      var board = req.params.board;
      db.collection(board)
        .find({})
        .project({
          reported: false,
          delete_password: false
        })
        .sort({ bumped_on: -1 })
        .limit(10)
        .toArray((err, list) => {
          if (err)
            console.log("DB ERROR in route GET /api/threads/:board - " + err);
          else {
            res.send(list);
          }
        });
    })

    //I can POST a thread to a specific message board by passing form data text and delete_password to /api/threads/{board}.
    //Saved will be: _id, text, created_on(date&time), bumped_on(date&time, starts same as created_on), reported(boolean),
    //delete_password, & replies(array).
    .post((req, res) => {
      var now = new Date();
      var board = req.params.board;
      db.collection(board).insertOne(
        {
          _id: shortid.generate(),
          text: req.body.text,
          created_on: now,
          bumped_on: now,
          reported: false,
          delete_password: req.body.delete_password,
          replies: []
        },
        (err, thread) => {
          if (err) {
            console.log("DB ERROR in route POST /api/threads/:board - " + err);
            res.send("error creating thread");
          } else {
            res.redirect("/b/" + board);
          }
        }
      );
    })

    //I can report a thread and change it's reported value to true by sending a PUT request to /api/threads/{board}
    //and pass along the thread_id. (Text response will be 'success')
    .put((req, res) => {
      var board = req.params.board;
      var id = req.body.report_id;

      db.collection(board).findOneAndUpdate(
        { _id: id },
        { $set: { reported: true } },
        (err, data) => {
          if (err) res.send("reporting unsuccessful");
          else res.send("success");
        }
      );
    })

    //I can delete a thread completely if I send a DELETE request to /api/threads/{board} and pass along the
    //thread_id & delete_password. (Text response will be 'incorrect password' or 'success')
    .delete(async function(req, res) {
      var board = req.params.board;
      var id = req.body.thread_id;
      var password = req.body.delete_password;
      var isAuthorized =
        (await db.collection(board).findOne({ _id: id })).delete_password ===
        password
          ? true
          : false;
      if (isAuthorized) {
        db.collection(board).deleteOne({ _id: id }, (err, data) => {
          if (err) res.send("delete error");
          else res.send("success");
        });
      } else res.send("incorrect password");
    });

  app
    .route("/api/replies/:board")

    .get((req, res) => {})

    .post((req, res) => {})

    .put((req, res) => {})

    .delete((req, res) => {});
};
