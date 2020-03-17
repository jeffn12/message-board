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
          .send({ text: "Test Thread", delete_password: "password" })
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
      test("delete thread from a board", done => {
        chai
          .request(server)
          .post("/api/threads/Tests")
          .send({
            text: "Test Thread",
            delete_password: "password",
            _id: "DELETETHREAD"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
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
    });

    suite("PUT", function() {
      test("report thread on a board", done => {
        chai
          .request(server)
          .post("/api/threads/Tests")
          .send({
            text: "Test Thread",
            delete_password: "password",
            _id: "REPORTTHREAD"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            chai
              .request(server)
              .put("/api/threads/Tests")
              .send({ thread_id: "REPORTTHREAD" })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, "reported");
                chai
                  .request(server)
                  .delete("/api/threads/Tests")
                  .send({
                    thread_id: "REPORTTHREAD",
                    delete_password: "password"
                  })
                  .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, "success");
                    done();
                  });
              });
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {});

    suite("GET", function() {});

    suite("PUT", function() {});

    suite("DELETE", function() {});
  });
});
