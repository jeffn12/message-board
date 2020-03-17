/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      test("add thread to a board", done => {
        chai
          .request(server)
          .post("/api/threads/Tests")
          .send({
            text: "Test Thread",
            delete_password: "password",
            _id: "TESTTHREAD"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", function() {
      test("get threads on a board", done => {
        chai
          .request(server)
          .get("/api/threads/Tests")
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isDefined(res.body[0]);
            assert.property(res.body[0], "_id");
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "bumped_on");
            assert.property(res.body[0], "replies");
            assert.notProperty(res.body[0], "reported");
            assert.notProperty(res.body[0], "delete_password");
            assert.isAtMost(res.body.length, 10);
            assert.isAtMost(res.body[0].replies.length, 3);
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("delete thread from a board, incorrect password", done => {
        chai
          .request(server)
          .post("/api/threads/Tests")
          .send({
            text: "Test Thread",
            delete_password: "password",
            _id: "DELETETHREAD"
          })
          .end((err, res) => {
            chai
              .request(server)
              .delete("/api/threads/Tests")
              .send({ thread_id: "DELETETHREAD", delete_password: "" })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, "incorrect password");
                done();
              });
          });
      });

      test("delete thread from a board, correct password", done => {
        chai
          .request(server)
          .delete("/api/threads/Tests")
          .send({ thread_id: "DELETETHREAD", delete_password: "password" })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

    suite("PUT", function() {
      test("report thread on a board", done => {
        chai
          .request(server)
          .put("/api/threads/Tests")
          .send({ thread_id: "TESTTHREAD" })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "reported");
            chai
              .request(server)
              .delete("/api/threads/Tests")
              .send({
                thread_id: "TESTTHREAD",
                delete_password: "password"
              })
              .end((err, res) => {
                done();
              });
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("add reply to a thread", done => {
        chai
          .request(server)
          .post("/api/threads/Tests")
          .send({
            text: "Test Reply",
            delete_password: "password",
            _id: "REPLYTHREAD"
          })
          .end((err, res) => {
            chai
              .request(server)
              .post("/api/replies/Tests?thread_id=REPLYTHREAD")
              .send({
                text: "Test Reply",
                delete_password: "password",
                thread_id: "REPLYTHREAD"
              })
              .end((err, res) => {
                assert.equal(res.status, 200);
                done();
              });
          });
      });
    });

    suite("GET", function() {
      test("get a thread with all replies", done => {
        chai
          .request(server)
          .get("/api/replies/Tests?thread_id=REPLYTHREAD")
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.property(res.body, "_id");
            assert.property(res.body, "text");
            assert.property(res.body, "created_on");
            assert.property(res.body, "bumped_on");
            assert.property(res.body, "replies");
            assert.notProperty(res.body, "reported");
            assert.notProperty(res.body, "delete_password");

            assert.isArray(res.body.replies);
            assert.isAbove(res.body.replies.length, 0);
            assert.property(res.body.replies[0], "_id");
            assert.property(res.body.replies[0], "text");
            assert.property(res.body.replies[0], "created_on");
            assert.notProperty(res.body.replies[0], "reported");
            assert.notProperty(res.body.replies[0], "delete_password");

            done();
          });
      });
    });

    suite("DELETE", function() {
      test("delete reply from a thread, incorrect password", done => {
        chai
          .request(server)
          .post("/api/threads/Tests?thread_id=REPLYTHREAD")
          .send({
            text: "Test Reply",
            delete_password: "password",
            _id: "DELETEREPLY",
            thread_id: "REPLYTHREAD"
          })
          .end((err, res) => {
            chai
              .request(server)
              .delete("/api/threads/Tests?thread_id=REPLYTHREAD")
              .send({ thread_id: "DELETEREPLY", delete_password: "" })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, "incorrect password");
                done();
              });
          });
      });

      test("delete thread from a board, correct password", done => {
        chai
          .request(server)
          .delete("/api/threads/Tests?thread_id=REPLYTHREAD")
          .send({ thread_id: "DELETEREPLY", delete_password: "password" })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

    //make sure to delete thread_id REPLYTHREAD when done with testing to prevent errors
    suite("PUT", function() {
      test("report reply on a thread", done => {
        chai
          .request(server)
          .post("/api/replies/Tests?thread_id=REPLYTHREAD")
          .send({
            text: "Test Thread",
            delete_password: "password",
            _id: "REPORTREPLY"
          })
          .end((err, res) => {
            chai
              .request(server)
              .put("/api/replies/Tests?thread_id=REPLYTHREAD")
              .send({ thread_id: "REPLYTHREAD", reply_id: "REPORTREPLY" })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, "reported");
                chai
                  .request(server)
                  .delete("/api/threads/Tests")
                  .send({
                    thread_id: "REPLYTHREAD",
                    delete_password: "password"
                  })
                  .end((err, res) => {
                    done();
                  });
              });
          });
      });
    });
  });
});
