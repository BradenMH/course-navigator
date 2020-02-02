import {QueryParser2} from "./QueryParser2";
const mfields: string[] = ["avg", "pass", "fail", "audit", "year"];
const sfields: string[] = ["dept", "id", "instructor", "title", "uuid"];
const mfieldsR: string[] = ["lat", "lon", "seats"];
const sfieldsR: string[] = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
const mfieldsAll: string[] = [].concat(mfields, mfieldsR);
const sfieldsAll: string[] = [].concat(sfields, sfieldsR);
const allfields: string [] = [].concat(sfieldsAll, mfieldsAll);
export class QueryParser {
    private columns: string[];
    private isThereTrans: boolean;

    constructor() {
        this.columns = [];
    }

    public isQueryValid(query: any): boolean {
        if (!(query instanceof Object)) {
            return false;
        }
        let keys: string[] = Object.keys(query);
        if (keys.length < 2 || keys.length > 3) {
            return false;
        }
        if (keys[0] !== "WHERE" || keys[1] !== "OPTIONS") {
            return false;
        }
        let where: any = query["WHERE"];
        if (!(where instanceof Object)) {
            return false;
        }
        if (Object.keys(where).length !==  0) {
            if (!this.isFilterValid(where)) {
                return false;
            }
        }
        let options: any = query["OPTIONS"];
        if (keys.length === 3) {
            this.isThereTrans = true;
        }
        if (!this.isOptionsValid(options)) {
            return false;
        }
        if (keys.length === 3) {
            if (keys[2] !== "TRANSFORMATIONS") {
                return false;
            }
            let queryParser2 = new QueryParser2(this.columns);
            if (!queryParser2.isTransValid(query["TRANSFORMATIONS"])) {
                return false;
            }
        }
        return true;
    }

    private isFilterValid(filter: any): boolean {
        if (!(filter instanceof Object)) {
            return false;
        }
        let keys: string[] = Object.keys(filter);
        if (keys.length !== 1) {
            return false;
        }
        let filterKey: string = keys[0];
        let filterType: any = filter[filterKey];
        if (filterKey === "GT" || filterKey === "EQ" || filterKey === "LT") {
            if (!(this.isMCompValid(filterType))) {
                return false;
            }
        }
        if (filterKey === "IS") {
            if (!(this.isSCompValid(filterType))) {
                return false;
            }
        }
        // check validity of logic comparator
        if (filterKey === "AND" || filterKey === "OR") {
            if (!(this.isLCompValid(filterType))) {
                return false;
            }
        }
        if (filterKey === "NOT") {
            if (!(this.isFilterValid(filterType))) {
                return false;
            }
        }
        if (!(filterKey === "NOT" || filterKey === "IS" || filterKey === "AND" || filterKey === "OR" ||
            filterKey === "EQ" || filterKey === "GT" || filterKey === "LT")) {
            return false;
        }
        return true;
    }

    private isMCompValid(mComp: any) {
        if (!(mComp instanceof Object)) {
            return false;
        }
        let mKeys: string[] = Object.keys(mComp);
        if (mKeys.length !== 1) {
            return false;
        }
        let mKey: string = mKeys[0];
        let mVal: any = mComp[mKey];
        let mKeyBreak: string[] = mKey.split("_");
        let idstring: string = mKeyBreak[0];
        let mfield: string = mKeyBreak[1];
        if (!(typeof mVal === "number" && mfieldsAll.includes(mfield))) {
            return false;
        }
        return true;
    }

    private isSCompValid(sComp: any): boolean {
        if (!(sComp instanceof Object)) {
            return false;
        }
        let sKeys: string[] = Object.keys(sComp);
        if (sKeys.length !== 1) {
            return false;
        }
        let sKey: string = sKeys[0];
        let sVal: any = sComp[sKey];
        let sKeyBreak: string[] = sKey.split("_");
        let idstring: string = sKeyBreak[0];
        let sfield: string = sKeyBreak[1];
        if (!(typeof sVal === "string" && sfieldsAll.includes(sfield))) {
            return false;
        }
        if (sVal.includes("*")) {
            let firstIndex: number = sVal.indexOf("*");
            if (!(firstIndex === 0 ||
                firstIndex === sVal.length - 1 ||
                (firstIndex === 0 && sVal.indexOf("*", 1) === sVal.length - 1))) {
                return false;
            }
        }
        return true;
    }

    private isLCompValid(lComp: any): boolean {
        if (!(lComp instanceof Array)) {
            return false;
        }
        if (lComp.length === 0) {
            return false;
        }
        for (let element of lComp) {
            if (!(this.isFilterValid(element))) {
                return false;
            }
        }
        return true;
    }

    private isOptionsValid(options: any) {
        if (!(options instanceof Object)) {
            return false;
        }
        let optionKeys: string[] = Object.keys(options);
        if (optionKeys.length < 1 || optionKeys.length > 2) {
            return false;
        }
        if (!optionKeys.includes("COLUMNS")) {
            return false;
        }
        this.columns = options["COLUMNS"];
        if (!this.isValidColumns(this.columns)) {
            return false;
        }
        if (optionKeys.length === 2) {
            if (!optionKeys.includes("ORDER")) {
                return false;
            }
            if (!this.isOrderValid(options["ORDER"])) {
                return false;
            }
        }
        return true;
    }

    private isValidColumns(columns: any): boolean {
        if (!(columns instanceof Array)) {
            return false;
        }
        if (columns.length < 1) {
            return false;
        }
        for (let element of columns) {
            if (!(typeof element === "string")) {
                return false;
            }
            if (!this.isThereTrans) {
                let keyBreak: string[] = element.split("_");
                let idstring: string = keyBreak[0];
                let field: string = keyBreak[1];
                if (!(mfieldsAll.includes(field) || sfieldsAll.includes(field))) {
                    return false;
                }
            }
        }
        return true;
    }

    private isOrderValid(order: any): boolean {
        if (typeof order === "string") {
            if (!(this.columns.includes(order))) {
                return false;
            }
        }
        if (order instanceof Object) {
            let orderKeys: string[] = Object.keys(order);
            if (!(orderKeys.length === 2)) {
                return false;
            }
            if (orderKeys[0] !== "dir" || orderKeys[1] !== "keys") {
                return false;
            }
            if (order["dir"] !== "UP" && order["dir"] !== "DOWN") {
                return false;
            }
            if (!(order["keys"] instanceof Array)) {
                return false;
            }
            let keys: string[] = order["keys"];
            if (keys.length === 0) {
                return false;
            }
            for (let key of keys) {
                if (!(this.columns.includes(key)) || typeof key !== "string") {
                    return false;
                }
            }
        }
        if (!(order instanceof Object) && !(typeof order === "string")) {
            return false;
        }
        return true;
    }
}
