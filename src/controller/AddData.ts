import Log from "../Util";
import {
    IInsightFacade,
    IlistStoredDataSets,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    IstoredDatasets,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import * as JSZip from "jszip";
import {QueryParser} from "./QueryParser";
import QueryFilterer from "./QueryFilterer";
import InsightFacade from "./InsightFacade";
import {JSZipObject} from "jszip";

let jzip = require("jszip");
export class AddData {

    private insightFacade: InsightFacade;
    public dataContainer: IstoredDatasets[];

    constructor() {
        // this.insightFacade = new InsightFacade();
        this.dataContainer = [];
    }

    public setIstoredData(element: any): IstoredDatasets {
        return {
            id: element["Course"],
            dept: element["Subject"], avg: element["Avg"], instructor: element["Professor"],
            title: element["Title"], pass: element["Pass"], fail: element["Fail"],
            audit: element["Audit"], uuid: element["id"], year: element["Year"]
        };
    }

    public isValidDataSet(keys: string[]): boolean {
        return keys.includes("id") && keys.includes("Subject") && keys.includes("Avg") &&
            keys.includes("Professor") && keys.includes("Title")
            && keys.includes("Pass") && keys.includes("Fail") && keys.includes("Audit") &&
            keys.includes("Course") && keys.includes("Year");
    }

    // public isValidID(id: string): boolean {
    //     return id === "" || id === null || id === undefined || id.includes("_") ||
    //         this.insightFacade.idArray.includes(id) || id.trim().length === 0;
    // }

    public parseCourses(content: string): Promise<IstoredDatasets[] | never> {
        let thisContainer = this.dataContainer;
        let promises: Array<Promise<string>> = new Array<Promise<string>>();
        jzip = new JSZip();

        return new Promise<IstoredDatasets[]>(((resolve, reject) => {
            jzip.loadAsync(content, {base64: true}).then((zip: any) => {
                if (zip.folder(/^courses/).length === 0) {
                    reject(new InsightError());
                }
                zip.folder("courses").forEach(function (relativePath: string, filename: JSZipObject) {
                    promises.push(filename.async("text"));
                });
                Promise.all(promises).then((fileData: string[]) => {
                    for (let file of fileData) {
                        let parsedData: any = JSON.parse(file);
                        for (let element of parsedData.result) {
                            let validKeys = Object.keys(element);
                            if (element["Section"] === "overall") {
                                element["Year"] = 1900;
                            }
                            if (this.isValidDataSet(validKeys)) {
                                let thisStoredData: IstoredDatasets = this.setIstoredData(element);
                                thisContainer.push(thisStoredData);
                            }
                        }
                    }
                    if (thisContainer.length === 0) {
                        reject(new InsightError("no valid sections"));
                    }
                    Log.trace("");
                    resolve(thisContainer);
            }).catch((err: any) => {
                return reject(new InsightError(" rejecting in promises .all "));
            });
        }).catch((error: any) => {
            return reject(new InsightError("rejecting in load async"));
        });

        }));
    }
    // previous read from disk in case of errors
    // fs.readdir(filePath,  (err: any, fileNames: string[]) => {
    //     if (err) {
    //         return false;
    //     }
    //     if (fileNames.length === 0) {
    //         return;
    //     }
    //     for (let file of fileNames) {
    //         let finalPath = path.normalize("./data/" + file);
    //      //   let finalPath = path.join(filePath, "/", file);
    //         Log.trace(filePath);
    //         let content = fs.readFileSync(finalPath, "utf8");
    //         let parsedData: any[] = JSON.parse(content);
    //
    //         if (file.includes("rooms")) {
    //                 kind = InsightDatasetKind.Rooms;
    //             } else {
    //                 kind = InsightDatasetKind.Courses;
    //             }
    //         listable = {
    //                 id: file, kind: kind, numRows: parsedData.length, list: parsedData
    //             };
    //         idArray.push(file);
    //         // Log.trace(listable.list);
    //         thisCC.push(listable);
    //         Log.trace("");
    //     }
    // });
    // return true;
}
