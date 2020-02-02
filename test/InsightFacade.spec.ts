import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import {ParseHTML} from "../src/controller/ParseHTML";
import {AddData} from "../src/controller/AddData";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip",
        courses2: "./test/data/courses.zip",
        rooms2: "./test/data/rooms.zip",
        invalidCourses: "./test/data/invalidCourses.zip",
        invalidRooms: "./test/data/invalidRooms.zip",
        invalidDataset: "./test/data/invalidDataset.zip",
        smallSet: "./test/data/testforaddDataset.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.trace(err);
            expect.fail(err, expected, "Should not have rejected");
        });
    });
    it("Should add a rooms valid dataset", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.trace(err);
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("test read from disk pass", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            //  insightFacade.readFromDisk("./data");
        }).then(() => {
            expect(insightFacade.readFromDisk()).to.equal(true);
        });
        // let insightFacade1: InsightFacade = new InsightFacade();
    });
    it("test read from disk fail", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        insightFacade.addDataset(id, datasets[""], InsightDatasetKind.Courses).then((result: string[]) => {
            //  insightFacade.readFromDisk("./data");
        }).then(() => {
            expect(insightFacade.readFromDisk()).to.equal(false);
        });
        // let insightFacade1: InsightFacade = new InsightFacade();
    });
    it("Should add a valid dataset and list that dataset", function () {
        const id: string = "courses";
        const expected: InsightDataset[] = [{id: id, kind: InsightDatasetKind.Courses, numRows: 64612}];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets().then((result2: InsightDataset[]) => {
                expect(result2).to.deep.equal(expected);
            }).catch(() => {
                expect.fail();
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });
    it("Should add a valid rooms dataset and list that dataset", function () {
        const id: string = "rooms";
        const expected: InsightDataset[] = [{id: id, kind: InsightDatasetKind.Rooms, numRows: 364}];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            return insightFacade.listDatasets().then((result2: InsightDataset[]) => {
                expect(result2).to.deep.equal(expected);
            }).catch(() => {
                expect.fail();
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });
    it("test listDatasets one", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            insightFacade.listDatasets().then((res: InsightDataset[]) => {
                expect(res.length).to.be.equal(1);
            });
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should return an empty array if there are no datasets to list", function () {
        const expected: InsightDataset[] = [];
        return insightFacade.listDatasets().then((result: InsightDataset[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail();
        });
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid secondary dataset", function () {
        const id: string = "courses2";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should add a valid (different) dataset", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should add a valid (different) secondary dataset", function () {
        const id: string = "rooms2";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should not add already added dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result2: [string]) => {
                expect.fail("Can not add already added dataset");
            }).catch((err: any) => {
                expect(err).to.be.instanceof(InsightError);
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should not add already added dataset (even if first kind is different)", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result2: [string]) => {
                expect.fail("Can not add already added dataset");
            }).catch((err: any) => {
                expect(err).to.be.instanceof(InsightError);
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should throw an error if dataset doesn't exist", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[" "], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, new InsightError(), "Should not be added if dataset doesn't exist");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });

    it("Should throw an error if dataset doesn't exist 2", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[" "], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail(result, new InsightError(), "Should not be added if dataset doesn't exist");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });

    it("Should throw an error if id is null", function () {
        const id: string = null;
        const id2: string = "courses";
        return insightFacade.addDataset(id, datasets[id2], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, new InsightError(), "Should not be added if id is null");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });

    it("Should throw an error if id is null 2", function () {
        const id: string = null;
        const id2: string = "rooms";
        return insightFacade.addDataset(id, datasets[id2], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail(result, new InsightError(), "Should not be added if id is null");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });

    it("Should throw an error if id is undefined", function () {
        const id: string = undefined;
        const id2: string = "courses";
        return insightFacade.addDataset(id, datasets[id2], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, new InsightError(), "Should not be added if id is undefined");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });

    it("Should throw an error if id is undefined 2", function () {
        const id: string = undefined;
        const id2: string = "rooms";
        return insightFacade.addDataset(id, datasets[id2], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail(result, new InsightError(), "Should not be added if id is undefined 2");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });

    it("Should throw an error when adding if id contains underscore", function () {
        const id: string = "courses";
        return insightFacade.addDataset("__", datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, new InsightError(), "Should not be added if id contains underscore");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });

    it("Should throw an error when adding if id contains only whitespaces", function () {
        const id: string = "courses";
        return insightFacade.addDataset("  ", datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, new InsightError(), "Should not be added if id only contains whitespaces");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });

    // remove tests
    it("Should remove an existing dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const expected2: string = id;
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.removeDataset(id).then((result2: string) => {
                expect(result2).to.deep.equal(expected2);
            }).catch((err: any) => {
                expect.fail(err, expected, "Added dataset should of been removed");
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should throw an error when removing not-yet-added dataset", function () {
        const id: string = "courses";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, new InsightError(), "Should not be removed if not-yet-added to dataset");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(NotFoundError);
        });
    });

    it("Should throw an error when removing if id is only whitespaces", function () {
        const id: string = "   ";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, new InsightError(), "Should not be removed if id is only whitespaces");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });

    it("Should throw an error when removing if id contains underscore", function () {
        const id: string = "courses_";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, new InsightError(), "Should not be removed if id contains underscore");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });

    it("test parseHTML", function () {
        const HTML: ParseHTML = new ParseHTML();
        const content: string = "rooms";
        HTML.parseHTML(datasets[content]);

    });

    // it("test parseHTML", function () {
    //     const HTML: ParseHTML = new ParseHTML();
    //     const content: string = "rooms";
    //     HTML.parseHTML(datasets[content]).then((res: any) => {
    //        expect(res).length.to.equal()
    //    })
    //
    // });

    it("test getGeoLocation pass", function () {
        const HTML: ParseHTML = new ParseHTML();
        const url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team230/";
        const location = "6245%20Agronomy%20Road%20V6T%201Z4";
        const address = "6245 Agronomy Road V6T 1Z4";
        const expected = {lat: 49.26125, lon: -123.24807};
        let building: any = {};
        building.address = address;

        HTML.getGeoLocation(building).then((result: string) => {
            expect(result).to.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "should work");
        });
    });

    it("test getGeoLocation fail", function () {
        const HTML: ParseHTML = new ParseHTML();
        const url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team230/";
        const location = "6245%20Agronomy%20Road%20V6T%201Z4";
        const address = "6245 Agronomy Road V6T 1Z4";
        const expected = {lat: 49.26125, lon: -123.24807};
        let building: any = {};
        building.address = address;

        HTML.getGeoLocation(building).then((result: string) => {
            expect.fail("should not have worked");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });
    it("test getGeoLocation fail null", function () {
        const HTML: ParseHTML = new ParseHTML();
        const url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team230/";
        let building: any = {};
        building.address = null;

        HTML.getGeoLocation(building).then((result: string) => {
            expect.fail("should not have worked");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });
    it("test getGeoLocation fail undefined", function () {
        const HTML: ParseHTML = new ParseHTML();
        const url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team230/";
        let building: any = {};
        building.address = undefined;

        HTML.getGeoLocation(building).then((result: string) => {
            expect.fail("should not have worked");
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });
});


/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: any } = {
        courses: {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        rooms: {id: "rooms", path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms}
    };
    let insightFacade: InsightFacade = new InsightFacade();
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(ds.id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * For D1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
});
