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
            var replies;
            list.forEach(thread => {
              if (thread.replies.length !== 0) {
                replies = [];
                var replyCount =
                  thread.replies.length > 3 ? 3 : thread.replies.length;
                for (
                  var i = thread.replies.length - 1;
                  i > thread.replies.length - 1 - replyCount;
                  i--
                ) {
                  replies.push(sanitizeReply(thread.replies[i]));
                }
                thread.replies = replies;
              }
            });
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
          _id: req.body._id || shortid.generate(),
          text: req.body.text,
          created_on: now,
          bumped_on: now,
          reported: false,
          delete_password: req.body.delete_password,
          replies: [],
          replycount: 0
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
          else res.send("reported");
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

    //I can GET an entire thread with all it's replies from /api/replies/{board}?thread_id={thread_id}.
    //Also hiding the same fields.
    .get((req, res) => {
      var board = req.params.board;
      db.collection(board)
        .find({ _id: req.query.thread_id })
        .project({
          reported: false,
          delete_password: false
        })
        .toArray((err, doc) => {
          if (err) console.log(err);
          else {
            var replies = [];
            doc[0].replies
              .slice()
              .reverse()
              .forEach(rep => {
                replies.push(sanitizeReply(rep));
              });
            doc[0].replies = replies;
            res.send(doc[0]);
          }
        });
    })

    //I can POST a reply to a thead on a specific board by passing form data text, delete_password, & thread_id
    //to /api/replies/{board} and it will also update the bumped_on date to the comments date.
    //(Recomend res.redirect to thread page /b/{board}/{thread_id}) In the thread's 'replies' array will be saved
    //_id, text, created_on, delete_password, & reported.
    .post((req, res) => {
      var board = req.params.board;
      var now = new Date();
      db.collection(board).findOneAndUpdate(
        { _id: req.body.thread_id },
        {
          $push: {
            replies: {
              _id: req.body._id || shortid.generate(),
              text: req.body.text,
              created_on: now,
              reported: false,
              delete_password: req.body.delete_password
            }
          },
          $set: {
            bumped_on: now
          },
          $inc: {
            replycount: 1
          }
        },
        { returnOriginal: false },
        (err, doc) => {
          if (err) res.send("Error creating reply");
          else res.redirect("/b/" + board + "/" + req.body.thread_id);
        }
      );
    })

    //I can report a reply and change it's reported value to true by sending a PUT request to /api/replies/{board}
    //and pass along the thread_id & reply_id. (Text response will be 'success')
    .put(async (req, res) => {
      var board = req.params.board;
      var update = await getReportReplyUpdate(
        board,
        req.body.thread_id,
        req.body.reply_id
      );
      db.collection(board).findOneAndUpdate(
        { _id: req.body.thread_id },
        { $set: { replies: update } },
        (err, doc) => {
          if (err) res.send("report reply unsuccessful");
          else res.send("reported");
        }
      );
    })

    //I can delete a post(just changing the text to '[deleted]') if I send a DELETE request to /api/replies/{board}
    //and pass along the thread_id, reply_id, & delete_password. (Text response will be 'incorrect password' or 'success')
    .delete(async (req, res) => {
      var board = req.params.board;
      console.log(req.body);
      var update = await getDeleteUpdate(
        board,
        req.body.thread_id,
        req.body.reply_id,
        req.body.delete_password
      );
      if (update.auth) {
        db.collection(board).findOneAndUpdate(
          { _id: req.body.thread_id },
          { $set: { replies: update } },
          { returnOriginal: false },
          (err, doc) => {
            if (err) res.send("delete reply unsuccessful");
            else {
              res.send("success");
            }
          }
        );
      } else res.send("incorrect password");
    });

  //helper function to remove 'reported' and 'delete_password' elements from a reply object
  const sanitizeReply = function(reply) {
    return {
      _id: reply._id,
      text: reply.text,
      created_on: reply.created_on
    };
  };

  const getReportReplyUpdate = async function(board, thread_id, reply_id) {
    var update = (await db.collection(board).findOne({ _id: thread_id }))
      .replies;
    update.forEach(rep => {
      if (rep._id === reply_id) rep.reported = true;
    });
    return update;
  };

  const getDeleteUpdate = async function(board, thread_id, reply_id, password) {
    var update = (await db.collection(board).findOne({ _id: thread_id }))
      .replies;
    update.forEach(rep => {
      if (rep._id === reply_id && rep.delete_password === password) {
        rep.text = "[deleted]";
        update.auth = true;
      } else if (rep._id === reply_id && rep.delete_password !== password)
        update.auth = false;
    });
    return update;
  };
};
