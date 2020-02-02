import {Decimal} from "decimal.js/";

export default class QueryTransformer {

    public transformResults(toTrans: any[], trans: any): any[] {
        let groupedResults: any = this.groupResults(toTrans, trans["GROUP"]);
        let groupNames: string[] = Object.keys(groupedResults);
        let apply: any = trans["APPLY"];
        let results: any[] = [];
        for (let groupKey of groupNames) {
            let group: any[] = groupedResults[groupKey];
            let object: any = {};
            let groupKeys: string[] = groupKey.split(",");
            groupKeys.pop();
            for (let pair of groupKeys) {
                if (typeof pair !== "undefined") {
                    let field = pair.split(" ")[0];
                    let value = pair.split(" ")[1];
                    object[field] = value;
                }
            }
            for (let applyRule of apply) {
                let applyKey: string = Object.keys(applyRule)[0];
                let applyToken: string = Object.keys(applyRule[applyKey])[0];
                let key = applyRule[applyKey][applyToken].split("_")[1];
                let val: number = 0;
                if (applyToken === "AVG" || applyToken === "SUM") {
                    let sum: Decimal = new Decimal(0);
                    for (let section of group) {
                        sum = sum.add(new Decimal(section[key]));
                    }
                    if (applyToken === "SUM") {
                        val = Number(sum.toFixed(2));
                    }
                    if (applyToken === "AVG") {
                        let count: number = group.length;
                        let avg = (sum.toNumber() / count);
                        val = Number(avg.toFixed(2));
                    }
                }
                if (applyToken === "COUNT") {
                    val = this.count(group, key);
                }
                if (applyToken === "MAX" || applyToken === "MIN") {
                    val = this.findVal(applyToken, group, key);
                }
                object[applyKey] = val;
            }
            results.push(object);
        }
        return results;
    }

    private groupResults(toTrans: any[], group: string[]): any {
        let groups: any = {};
        for (let section of toTrans) {
            let groupName: string = "";
            for (let groupKey of group) {
                let field: string = groupKey.split("_")[1];
                groupName += field + " " + section[field] + ",";
            }
            let Group: any[] = groups[groupName];
            if (typeof Group === "undefined") {
                groups[groupName] = [section];
            } else {
                Group.push(section);
            }
        }
        return groups;
    }

    private findVal(applyToken: string, group: any[], key: string): number {
        if (applyToken === "MAX") {
            let max: number = group[0][key];
            for (let section of group) {
                if (section[key] > max) {
                    max = section[key];
                }
            }
            return max;
        } else {
            let min: number = group[0][key];
            for (let section of group) {
                if (section[key] < min) {
                    min = section[key];
                }
            }
            return min;
        }
    }

    private count(group: any[], key: any): number {
        let arr: any[] = [];
        for (let section of group) {
            if (!arr.includes(section[key])) {
                arr.push(section[key]);
            }
        }
        return arr.length;
    }
}
