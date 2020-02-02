import Log from "../Util";
import {
    IInsightFacade,
    IlistStoredDataSets,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    IroomsData,
    IstoredDatasets,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import * as JSZip from "jszip";
import {AddData} from "./AddData";
import {QueryParser} from "./QueryParser";
import QueryFilterer from "./QueryFilterer";
import {ParseHTML} from "./ParseHTML";
import QueryTransformer from "./QueryTransformer";

let jzip = require("jszip");
// import DataSets from "../src/controller/AddData.ts";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    // datasets is for storing added datasets listing them
    // dataStorage is to store locally on memory
    private dataSets: InsightDataset[];
    private dataContainer: IstoredDatasets[];
    private idArray: string[];
    private dataStorage: IlistStoredDataSets[];
    private ad: AddData;
    private html:  ParseHTML;
    private roomContainer: IroomsData[];
    // private storedData: IlistStoredDataSets[];
    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.dataSets = [];
        this.dataContainer = [];
        this.idArray = [];
        this.dataStorage = [];
        this.ad = new AddData();
        this.html = new ParseHTML();
        this.roomContainer = [];
        this.readFromDisk();
    }

    private isValidID(id: string): boolean {
        return id === "" || id === null || id === undefined || id.includes("_") ||
            this.idArray.includes(id) || id.trim().length === 0;
    }


    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        jzip = new JSZip();
        let fs = require("fs");
        let thisContainer = this.dataContainer;
        // let promises: Array<Promise<string>> = new Array<Promise<string>>();
        return new Promise<string[]>((resolve, reject) => {
            if (this.isValidID(id)) {
               return  reject(new InsightError("invalid ID"));
            }
            this.dataStorage.forEach(function (element) {
                    if (element.id === id) {
                       return  reject(new InsightError("dataset already exists in disk"));
                    }
                });
            if (kind === InsightDatasetKind.Courses) {
                this.ad.parseCourses(content).then((data: IstoredDatasets[]) => {
                    thisContainer = data;
                    this.dataStorage.push(this.listData(thisContainer, id, kind));
                    return fs.writeFile("./data/" + id + ".txt", JSON.stringify(thisContainer), (err: any) => {
                        if (err) {
                            return reject(new InsightError(`Could not save dataset: ${id} to disk`));
                        } else {
                            this.idArray.push(id);
                            return resolve(this.idArray);
                        }
                    });
                }).catch((err: any) => {
                    reject(new InsightError("rejecting in addData" + err));
                });
             } else if (kind === InsightDatasetKind.Rooms) {
                this.html.parseHTML(content).then((rooms: IroomsData[]) => {
                    this.roomContainer = rooms;
                    this.dataStorage.push(this.listData(this.roomContainer, id, kind));
                    return fs.writeFile("./data/" + id + ".txt", JSON.stringify(this.roomContainer), (err: any) => {
                        if (err) {
                            reject(new InsightError(`Could not save dataset: ${id} to disk`));
                        } else {
                            this.idArray.push(id);
                            resolve(this.idArray);
                        }
                    });
                }).catch((err: any) => {
                    return reject(new InsightError("rejecting in parseHTML" + err));
                });
            } else {
                reject (new InsightError("kind does not exist"));
            }
        });
    }

    private listData(container: any[], id: string, kind: InsightDatasetKind ): IlistStoredDataSets {
        let listable: IlistStoredDataSets = {
            id: id, kind: kind,
            numRows: container.length, list: container
        };
        return listable;
    }

    public removeDataset(id: string): Promise<string> {
        const pat = require("path");
        const path: string = pat.normalize("./data/" + id + ".txt");
        const fs = require("fs");
        // check if id is invalid and throw an insight error if so
        Log.trace("inside remove dataset");
        if (id === " " || id === null || id === "   " || id === undefined || id === "  " || id.includes("_")) {
            Log.trace("rejecting in invalid id");
            return  Promise.reject(new InsightError("cannot remove invalid ID"));
        }
        if (this.dataStorage === undefined) {
            return Promise.reject(new InsightError("undefined dataset"));
        }
        for (let x in this.dataStorage) {
            if (id === this.dataStorage[x].id) {
                fs.unlink(path, (err: any) => {
                    if (err) {
                        Log.trace("rejecting in unlink");
                        return Promise.reject(new InsightError(" error deleting file"));
                    }
                });
                delete this.dataStorage[x];
                return Promise.resolve(id);
            }
        }
        Log.trace(this.dataContainer);
        return Promise.reject(new NotFoundError("ID does not exist"));
    }

    public performQuery(query: any): Promise <any[]> {
        let that = this;
        let queryParser1: QueryParser = new QueryParser();
        let result: any[] = [];
        return new Promise<any[]>(function (resolve, reject) {
            if (!(queryParser1.isQueryValid(query))) {
                return reject(new InsightError("The query does not follow the grammar of the EBNF"));
            }
            let options: any = query["OPTIONS"];
            let columns: string[] = options["COLUMNS"];
            let id: string = columns[0].split("_")[0];
            let indexOfDataset: number = that.idArray.indexOf(id);
            if (indexOfDataset === -1) {
                return reject(new InsightError("The dataset referenced in query has not been added."));
            }
            let dataSet: any[] = that.dataStorage[indexOfDataset]["list"];
            let queryFilter: QueryFilterer = new QueryFilterer(dataSet);
            result = queryFilter.filterQuery(query["WHERE"]);
            if (result.length === 0) {
                return resolve(result);
            }
            if (result.length > 5000) {
                return reject(new ResultTooLargeError("Only queries with a maximum of 5000 results are supported."));
            }
            if (Object.keys(query).length === 3) {
                let queryTransformer: QueryTransformer = new QueryTransformer();
                let result2 = queryTransformer.transformResults(result, query["TRANSFORMATIONS"]);
                result = result2;
            }
            let result3 = [];
            for (let element of result) {
                let section: any = {};
                for (let column of columns) {
                    let field: string = column;
                    if (column.includes("_")) {
                        field = column.split("_")[1];
                    }
                    section[column] = element[field];
                }
                result3.push(section);
            }
            let optionKeys: string[] = Object.keys(options);
            if (optionKeys.length === 2) {
                let order: string = options["ORDER"];
                let orderedResults: any[] = that.sortByOrder(result3, order);
                return resolve(orderedResults);
            }
            return resolve(result3);
        });
    }

    private sortByOrder(toSort: any[], order: any): any[] {
        if (typeof order === "string") {
            toSort.sort((a, b) => {
                if (a[order] > b[order]) {
                    return 1;
                }
                if (a[order] === b[order]) {
                    return 0;
                } else {
                    return -1;
                }
            });
            return toSort;
        } else {
            let keys: string[] = order["keys"];
            let dir: string = order["dir"];
            if (dir === "DOWN") {
                toSort.sort(function (a, b) {
                    for (let key of keys) {
                        if (a[key] < b[key]) {
                            return 1;
                        } else if (a[key] > b[key]) {
                            return -1;
                        }
                    }
                    return 0;
                });
            } else {
                toSort.sort(function (a, b) {
                    for (let key of keys) {
                        if (a[key] > b[key]) {
                            return 1;
                        } else if (a[key] < b[key]) {
                            return -1;
                        }
                    }
                    return 0;
                });
            }
        }
        return toSort;
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let emptyDataset: InsightDataset[] = [];
        // calculate number of rows stored in memory
        for (let x in this.dataStorage) {
            let listAbleData: InsightDataset = {
                id: this.dataStorage[x].id,
                kind: this.dataStorage[x].kind,
                numRows: this.dataStorage[x].numRows
            };
            Log.trace(this.dataStorage[x].id);
            this.dataSets.push(listAbleData);
        }
        return new Promise<InsightDataset[]>((resolve) => {
            if (this.dataSets.length !== 0) {
                return resolve(this.dataSets);
            }
            return resolve(emptyDataset);
        });
    }

    public readFromDisk(): boolean {
        let fs = require("fs");
        const path = require("path");
        let thisCC = this.dataStorage;
        let listable: IlistStoredDataSets;
        let idArray = this.idArray;
        let kind: InsightDatasetKind;

        let filePath = path.normalize("./data");
        try {
            let fileNames: string[] = fs.readdirSync(filePath);
            if (fileNames.length === 0) {
                return;
            }
            for (let file of fileNames) {
                let finalPath = path.normalize("./data/" + file);
                //   let finalPath = path.join(filePath, "/", file);
                Log.trace(filePath);
                let content = fs.readFileSync(finalPath, "utf8");
                let parsedData: any[] = JSON.parse(content);
                let id: string;
                if (file.includes("rooms")) {
                    kind = InsightDatasetKind.Rooms;
                    id = "rooms";
                } else {
                    kind = InsightDatasetKind.Courses;
                    id = "courses";
                }
                listable = {
                    id: id, kind: kind, numRows: parsedData.length, list: parsedData
                };
                idArray.push(id);
                thisCC.push(listable);
            }
            return true;
        } catch (e) {
            if (e) {
                Log.trace(e.message);
                return false;
            }
        }
    }
}
