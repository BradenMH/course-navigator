// Has to be a valid zip file; this zip will contain files and subdirectories under a folder called rooms/.
// This directory name will not vary with the dataset id.
//     Valid buildings will always be in HTML format.
// Missing (i.e. Empty string) values found in valid elements are okay.
//     If a building contains no rooms at all, skip over it.
//     If a building does not elicit a valid geolocation, skip over it.
//     A valid dataset has to contain at least one valid room that meets the requirements above.

// validity

import {IlistStoredDataSets, InsightError, IroomsData, IstoredDatasets} from "./IInsightFacade";
import Log from "../Util";
import * as JSZip from "jszip";
let jzip = require("jszip");
let fs = require("fs");
const parse5 = require("parse5");
const http = require("http");

export class ParseHTML {
    public parsedBuildingData: any[];
    private isRoom: boolean;
    private parsedRoomData: IroomsData[];
    constructor() {
         this.parsedBuildingData = [];
         this.parsedRoomData = [];

    }

    public parseHTML(content: string): Promise<IroomsData[]> {
        this.isRoom = false;
        jzip = new JSZip();
        return new  Promise<IroomsData[]>((resolve, reject) => {
            jzip.loadAsync(content, {base64: true}).then((zip: any) => {
                // if (zip.folder(/^rooms/).length === 0) {
                //     reject(new InsightError());
                // }
                zip.folder("rooms").file("index.htm").async("text").then((fileData: string) => {
                    const doc = parse5.parse(fileData);
                    this.traverseTree(doc);
                    this.isRoom = true;
                    // get room data
                    let promises: Array<Promise<string>> = new Array<Promise<string>>();
                    for (let buildingData of this.parsedBuildingData) {
                        promises.push(zip.file("rooms" + buildingData.href.substring(1)).async("text")
                                .then(async (buildingFileData: string) => {
                                    try {
                                        await this.getGeoLocation(buildingData);
                                    } catch (e) {
                                        Log.trace(e.message);
                                    }
                                    let countSoFar: number = this.parsedRoomData.length;
                                    this.traverseTree(parse5.parse(buildingFileData));
                                    // populate room name
                                    for (let i = countSoFar; i < this.parsedRoomData.length; i++) {
                                        let currentRoom = this.parsedRoomData[i];
                                        currentRoom["fullname"] = buildingData["fullname"];
                                        currentRoom["shortname"] = buildingData["shortname"];
                                        currentRoom["address"] = buildingData["address"];
                                        currentRoom["lat"] = buildingData["lat"];
                                        currentRoom["lon"] = buildingData["lon"];
                                        currentRoom["href"] = String("http://students.ubc.ca") +
                                            String(buildingData["href"].substring(1, 42)) +
                                            "/room/" +
                                            String(buildingData["href"].substring(43)) + "-"
                                            + String(currentRoom["number"]);
                                        currentRoom.name = buildingData["shortname"] + "_" +
                                            this.parsedRoomData[i].number;
                                    }
                                }).catch((err: any) => {
                                return reject(new InsightError());
                            }));
                    }
                    Promise.all(promises).then(() => {
                        return resolve(this.parsedRoomData);
                    });
                }).catch(() => {
                    return reject(new InsightError("rejecting in async"));
                });
            }).catch(() => {
                return reject(new InsightError("rejecting in loadasync"));
            });
        });
    }
    // input param a fucntion that returns true or false whether data is what
    // potentyiialy add a param for goal

    private traverseTree(node: any) {
        if (node.nodeName === "table" && this.containsClassInfo(node, "views-table cols-5 table")) {
            // look for tbody and iterate through every tr of that body and extract data
            this.extractRows(node);
        }

        if (node.hasOwnProperty("childNodes")) {
           for (let childNode of node.childNodes) {
               this.traverseTree(childNode);
           }
        }
    }

    private extractRows(node: any) {
        for (let tableChildNode of node.childNodes) {
            if (tableChildNode.nodeName === "tbody") {
                // iterate through
                for (let trChildNode of tableChildNode.childNodes) {
                    // todo check if class is even or odd
                    if (trChildNode.nodeName === "tr" && (this.containsClassInfo(trChildNode, "odd") ||
                    this.containsClassInfo(trChildNode, "even"))) {
                        this.extactColumns(trChildNode);
                    }

                }
            }
        }
    }

    private extactColumns(trNode: any) {
        let buildingData: IroomsData = {};
        if (this.isRoom) {
          //  this.parsedRoomData.push(this.parseRooms(trNode));
            this.parseRooms(trNode);
            return;
        }
        for (let trChildNode of trNode.childNodes) {
            if (trChildNode.nodeName === "td") {
                // todo dont hard code this actually search
                let valueToSave = trChildNode.childNodes[0].value.trim();
                if (this.containsClassInfo(trChildNode, "building-code")) {
                    buildingData["shortname"] = trChildNode.childNodes[0].value.trim();
                } else if (this.containsClassInfo(trChildNode, "title")) {
                     this.populateTitleData(trChildNode, buildingData);
                } else if (this.containsClassInfo(trChildNode, "address")) {
                    buildingData["address"] = trChildNode.childNodes[0].value.trim();
                }
            }
        }
        this.parsedBuildingData.push(buildingData);
    }

    private populateTitleData(trChildNode: any, roomData: any) {
        for (let tdChildNode of trChildNode.childNodes) {
            if (tdChildNode.nodeName === "a") {
              for (let attr of tdChildNode.attrs) {
                  if (attr.name === "href") {
                      roomData["href"] = attr.value;
                  }
              }
              roomData["fullname"] = tdChildNode.childNodes[0].value;
            }
        }
    }

    private populateRoomTitle(trChildNode: any, roomData: any) {
        for (let tdChildNode of trChildNode.childNodes) {
            if (tdChildNode.nodeName === "a") {
                roomData["number"] = tdChildNode.childNodes[0].value;
            }
        }
    }

    private parseRooms(trNode: any) {
        let roomData: IroomsData = {};
        for (let trChildNode of trNode.childNodes) {
            if (trChildNode.nodeName === "td") {
                // todo dont hard code this actually search
               // let valueToSave = trChildNode.childNodes[0].value.trim();
                if (this.containsClassInfo(trChildNode, "room-number")) {
                    this.populateRoomTitle(trChildNode, roomData);
                   // roomData["name"] =
                } else if (this.containsClassInfo(trChildNode, "room-capacity")) {
                   roomData["seats"] = Number(trChildNode.childNodes[0].value.trim());
                   if (typeof trChildNode.childNodes[0] === "undefined") {
                       roomData["seats"] = 0;
                   }
                } else if (this.containsClassInfo(trChildNode, "room-type")) {
                    roomData["type"] = trChildNode.childNodes[0].value.trim();
                } else if (this.containsClassInfo(trChildNode, "room-furniture")) {
                    roomData["furniture"] = trChildNode.childNodes[0].value.trim();
                 }
            }
          //  tempArray.push(roomData);
        }
        // return roomData;
        this.parsedRoomData.push(roomData);
    }

    private containsClassInfo(node: any, className: string): boolean {
        return node.attrs != null &&
         node.attrs.filter((attr: any) => {
            return attr.hasOwnProperty("name") && attr.hasOwnProperty("value") && attr["name"] === "class" &&
                attr["value"].includes(className);
        }).length > 0;
    }

    public getGeoLocation(buildingData: any): Promise<string> {
        // skip over bukdiings that have invalid geolocations
        let url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team230/";
        if (buildingData.address === undefined || buildingData.address === null) {
            return Promise.reject(new InsightError("no address"));
        }
        let location = buildingData.address;
        let encodedLoc = url + encodeURI(location);
        return new Promise<string>(((resolve, reject) => {
            http.get(encodedLoc, (res: any) => {
                const {statusCode} = res;
                const contentType = res.headers["content-type"];

                let error;
                if (statusCode !== 200) {
                    error = new Error("Request Failed.\n" +
                        "Status Code: ${statusCode}");
                } else if (!/^application\/json/.test(contentType))  {
                    error = new Error("Invalid content-type.\n" +
                        "Expected application/json but received ${contentType}");
                }
                if (error) {
                    reject(new InsightError(error.message));
                    res.resume();
                    return;
                }

                res.setEncoding("utf8");
                let rawData = "";

                res.on("data", (chunk: any) => {
                    rawData += chunk;
                });
                res.on("end", () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        buildingData["lat"] = parsedData["lat"];
                        buildingData["lon"] = parsedData["lon"];
                        resolve(parsedData);
                    } catch (e) {
                        Log.error(e.message);
                        return Promise.reject(new InsightError(e.message));
                    }
                });
            }).on("error", (e: any) => {
               reject(new InsightError(e.message));
            });
        }));
    }
}
