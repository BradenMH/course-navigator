export default class QueryFilterer {

    public dataset: any[];

    constructor(dataset: any[]) {
        this.dataset = dataset;
    }

    public filterQuery(filter: any): any[] {
        let filtered: any[] = [];
        if (Object.keys(filter).length === 0) {
            return this.dataset;
        }
        for (let section of this.dataset) {
            if (this.isValidSection(section, filter)) {
                filtered.push(section);
            }
        }
        return filtered;
    }


    private isValidSection(section: any, filter: any): boolean {
        let filterKey: string = Object.keys(filter)[0];
        let comp: any = filter[filterKey];
        if (filterKey === "GT" || filterKey === "EQ" || filterKey === "LT" || filterKey === "IS") {
            let val: any = comp[Object.keys(comp)[0]];
            let field: string = Object.keys(comp)[0].split("_")[1];
            if (filterKey === "GT") {
                if (section[field] > val) {
                    return true;
                }
            }
            if (filterKey === "LT") {
                if (section[field] < val) {
                    return true;
                }
            }
            if (filterKey === "IS") {
                return this.isSCompTrue(section, comp);
            }
            if (filterKey === "EQ") {
                if (section[field] === val) {
                    return true;
                }
            } else {
                return false;
            }
        }
        if (filterKey === "AND" || filterKey === "OR" || filterKey === "NOT") {
            if (filterKey === "NOT") {
                return !this.isValidSection(section, comp);
            }
            if (filterKey === "AND") {
                for (let element of comp) {
                    if (!this.isValidSection(section, element)) {
                        return false;
                    }
                }
                return true;
            } else {
                for (let element of comp) {
                    if (this.isValidSection(section, element)) {
                        return true;
                    }
                }
                return false;
            }
        }
    }

    private isSCompTrue(section: any, sComp: any): boolean {
        let key: any = Object.keys(sComp)[0];
        let val: any = sComp[key];
        let keyBreak: string[] = key.split("_");
        let field: string = keyBreak[1];
        if (val.includes("*")) {
            let firstIndex = val.indexOf("*");
            // * at front and back
            if (firstIndex === 0 && val.indexOf("*", 1) === val.length - 1) {
                    if (section[field].includes(val.substr(1, val.length - 2))) {
                        return true;
                    }
            } else if (firstIndex === 0) {
                let valRelevant = val.substr(1);
                let fieldLength: number = section[field].length;
                if (section[field].substr(fieldLength - valRelevant.length) === valRelevant) {
                    return true;
                }
            } else {
                let valRelevant: string = val.substr(0, val.length - 1);
                if (section[field].substr(0, valRelevant.length) === valRelevant) {
                    return true;
                }
            }
            return false;
        } else {
            if (section[field] === val) {
                return true;
            }
        }
        return false;
    }


}
