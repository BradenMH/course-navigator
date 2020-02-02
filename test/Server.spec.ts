import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";
import fs = require("fs");

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        server.start().then(() => {
            Log.trace("server started successfully");
        }).catch(() => {
            Log.trace("server start error");
        });
    });

    after(function () {
        // TODO: stop server here once!
        server.stop().then(() => {
            Log.trace("server stopped");
        }).catch( ()  => {
            Log.trace("error stopping server");
        });
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // TODO: read your courses and rooms datasets here once!

    // Sample on how to format PUT requests
    it("PUT test for rooms dataset", function () {
        let rooms = fs.readFileSync("./test/data/rooms.zip");
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms/rooms")
                .send(rooms)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("failing in put catch");
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("failing in put try catch" + err.message);
        }
    });
    it("PUT test for courses dataset", function () {
        let rooms = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .send(rooms)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("failing in put catch");
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("failing in put try catch" + err.message);
        }
    });

    it("PUT test fail", function () {
        let rooms = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/couses")
                .send(rooms)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect.fail();
                    expect(res).to.be.equal(400);
                })
                .catch(function (err: Response) {
                    // some logging here please!
                    Log.trace("failing in put catch");
                    expect(err.status).to.be.equal(400);
                   // expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("failing in put try catch" + err.message);
        }
    });
    it ("GET Test", function () {
        let rooms = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request("http://localhost:4321")
                .get("/datasets")
                .send(rooms)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("failing in put catch");
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("failing in put try catch" + err.message);
        }
    });
    it("post test", function () {
        //  let rooms = fs.readFileSync("./test/data/rooms.zip");
        let query = {
            WHERE: {
                GT: {
                    courses_avg: 97
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_avg"
                ],
                ORDER: "courses_avg"
            }
        };
       // let Stringquery = JSON.stringify(query);
        try {
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(query)
                .set("Content-Type", "application/json")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("failing in post catch");
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("failing in put try catch" + err.message);
        }
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
    it("delete test for courses dataset", function () {
        let rooms = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/courses")
                .send(rooms)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("failing in del catch");
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("failing in put try catch" + err.message);
        }
    });
    it("delete test for rooms dataset", function () {
        let rooms = fs.readFileSync("./test/data/rooms.zip");
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/rooms")
                .send(rooms)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("failing in del catch");
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("failing in put try catch" + err.message);
        }
    });
    it("delete test for courses dataset NOTFOUND", function () {
        let rooms = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/courses")
                .send(rooms)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect.fail();
                  //  expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("failing in del catch");
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("failing in put try catch" + err.message);
        }
    });
    it("delete test for courses dataset InsightErr", function () {
        let rooms = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/courz")
                .send(rooms)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect.fail();
                    //  expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("failing in del catch");
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("failing in put try catch" + err.message);
        }
    });
    it("post fail", function () {
        //  let rooms = fs.readFileSync("./test/data/rooms.zip");
        let query = {
            WHERE: {
                GT: {
                    courses_avg: 97
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_avg"
                ],
                ORDER: "courses_avg"
            }
        };
        let Stringquery = JSON.stringify(query);
        try {
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(Stringquery)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("failing in post catch");
                    expect(err.status).to.be.equal(400);
                   // expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("failing in put try catch" + err.message);
        }
    });

});
