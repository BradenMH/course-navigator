const mfields: string[] = ["avg", "pass", "fail", "audit", "year"];
const sfields: string[] = ["dept", "id", "instructor", "title", "uuid"];
const numOperators: string[] = ["MAX", "MIN", "SUM", "AVG"];
const operators: string[] = ["COUNT"].concat(numOperators);
const mfieldsR: string[] = ["lat", "lon", "seats"];
const sfieldsR: string[] = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
const mfieldsAll: string[] = [].concat(mfields, mfieldsR);
const sfieldsAll: string[] = [].concat(sfields, sfieldsR);
const allfields: string [] = [].concat(sfieldsAll, mfieldsAll);
export class QueryParser2 {
    private columns: string[];
    private applyKeys: string[];
    private group: string[];
    constructor(columns: string[]) {
        this.columns = columns;
        this.applyKeys = [];
        this.group = [];
    }

    public isTransValid(trans: any): boolean {
        if (!(trans instanceof Object)) {
            return false;
        }
        let transKeys: string[] = Object.keys(trans);
        if (transKeys.length !== 2) {
            return false;
        }
        if (transKeys[0] !== "GROUP" || transKeys[1] !== "APPLY") {
            return false;
        }
        this.group = trans["GROUP"];
        let apply: any = trans["APPLY"];
        if (!(this.group instanceof Array) || !(apply instanceof Array)) {
            return false;
        }
        if (this.group.length === 0 || apply.length === 0) {
            return false;
        }
        for (let grouping of this.group) {
            if (typeof grouping !== "string") {
                return false;
            }
        }
        if (!(this.isApplyValid(apply))) {
            return false;
        }
        let toCheck: string[] = [].concat(this.group, this.applyKeys);
        for (let key of this.columns) {
            if (!toCheck.includes(key)) {
                return false;
            }
        }
        return true;
    }

    private isApplyValid(apply: any[]): boolean {
        for (let applyRule of apply) {
            if (!(applyRule instanceof Object)) {
                return false;
            }
            let applyRuleKeys: string[] = Object.keys(applyRule);
            if (applyRuleKeys.length !== 1) {
                return false;
            }
            let applyKey = applyRuleKeys[0];
            if (applyKey.includes("_") || applyKey.length < 1 || this.applyKeys.includes(applyKey) ||
                !this.columns.includes(applyKey)) {
                return false;
            }
            let applyKeyVal: any = applyRule[applyKey];
            if (!(applyKeyVal instanceof Object)) {
                return false;
            }
            let applyKeyValKeys: string[] = Object.keys(applyKeyVal);
            if (applyKeyValKeys.length !== 1) {
                return false;
            }
            let applyToken = applyKeyValKeys[0];
            if (!(operators.includes(applyToken))) {
                return false;
            }
            let key = applyKeyVal[applyToken];
            if (!(typeof key === "string")) {
                return false;
            }
            let field: string = key.split("_")[1];
            if (!(allfields.includes(field))) {
                return false;
            }
            if (numOperators.includes(applyToken)) {
                if (!(mfieldsAll.includes(field))) {
                    return false;
                }
            }
            this.applyKeys.push(applyKey);
        }
        return true;
    }
}
