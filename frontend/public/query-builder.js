/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

CampusExplorer.buildQuery = function () {
    let query = {};
    let datasetKind = document.getElementsByClassName("tab-panel active")[0].getAttribute("data-type");
    query["WHERE"] = buildFilter(datasetKind);
    query["OPTIONS"] = buildOptions(datasetKind);
    if (document.getElementsByClassName("tab-panel active")[0].getElementsByClassName("transformations-container")[0].children.length > 0) {
        query["TRANSFORMATIONS"] = buildTransformations(datasetKind);
    }
    return query;
};

function buildFilter(kind) {
    let tab = document.getElementsByClassName("tab-panel active")[0];
    let filter = {};
    let conditions = tab.getElementsByClassName("conditions-container")[0].children;
    if (conditions.length === 0) {
        return filter;
    }
    let logicVal = [];
    for (let condition of conditions) {
        let key;
        let comp;
        for (let potentialComp of condition.children[2].children[0].children) {
            if (potentialComp.getAttribute("selected") === "selected") {
                comp = potentialComp.getAttribute("value");
            }
        }
        let field = condition.children[3].children[0].getAttribute("value");
        if (comp === "GT" || comp === "EQ" || comp === "LT") {
            field = parseFloat(field);
        }
        for (let potentialKey of condition.children[1].children[0].children) {
            if (potentialKey.getAttribute("selected") === "selected") {
                key = kind + "_" + potentialKey.getAttribute("value");
            }
        }
        let keyFieldObj = {};
        keyFieldObj[key] = field;
        let obj = {};
        obj[comp] = keyFieldObj;
        if (condition.children[0].children[0].getAttribute("checked") === "checked") {
            let not = {};
            not["NOT"] = obj;
            logicVal.push(not);
        } else {
            logicVal.push(obj);
        }
    }
    if (conditions.length === 1) {
        return logicVal[0];
    }
    if (conditions.length > 1) {
        let logic;
        if (tab.getElementsByClassName("control conditions-any-radio")[0].children[0].getAttribute("checked") === "checked") {
            logic = "OR";
        } else if (tab.getElementsByClassName("control conditions-all-radio")[0].children[0].getAttribute("checked") === "checked" ||
            tab.getElementsByClassName("control conditions-all-radio")[0].children[0].getAttribute("checked") === "") {
            logic = "AND";
        } else {
            logic = "NOT";
        }
        if (logic === "NOT") {
            let or = {};
            or["OR"] = logicVal;
            filter[logic] = or;
        } else {
            filter[logic] = logicVal;
        }
        return filter;
    }
}

function buildOptions(kind) {
    let tab = document.getElementsByClassName("tab-panel active")[0];
    let options = {};
    let yo;
    let columns = [];
    let applyKeys = getApplyKeys();
    let potentialColumns = tab.getElementsByClassName('form-group columns')[0].children[1].children;
    let columnKey;
    for (let potentialColumn of potentialColumns) {
        if (potentialColumn.children[0].getAttribute("checked") === "checked") {
            columnKey = potentialColumn.children[0].getAttribute("value");
            if (!applyKeys.includes(columnKey)) {
                columnKey = kind + "_" + columnKey;
            }
            columns.push(columnKey);
        }
    }
    options["COLUMNS"] = columns;
    // order
    let keys = [];
    let potentialKeys = tab.getElementsByClassName("control order fields")[0].children[0].children;
    let orderKey;
    for (let potentialKey of potentialKeys) {
        if (potentialKey.getAttribute("selected") === "selected") {
            orderKey = potentialKey.getAttribute("value");
            if (!applyKeys.includes(orderKey)) {
                orderKey = kind + "_" + orderKey;
            }
            keys.push(orderKey);
        }
    }
    if (keys.length > 0) {
        let dir = "UP";
        let isDes = tab.getElementsByClassName("control descending")[0].children[0].getAttribute("checked") === "checked";
        if (isDes) {
            dir = "DOWN";
        }
        if (keys.length === 1 && !isDes) {
            options["ORDER"] =  keys[0];
        } else {
            let order = {};
            order["dir"] = dir;
            order["keys"] = keys;
            options["ORDER"] = order;
        }
    }
    return options;
}

function getApplyKeys() {
    let applyKeys = [];
    let container = document.getElementsByClassName("tab-panel active")[0].getElementsByClassName("transformations-container")[0].children;
    for (let applyRule of container) {
        let applyKey = applyRule.children[0].children[0].getAttribute("value");
        applyKeys.push(applyKey);
    }
    return applyKeys;
}

function buildTransformations(kind) {
    let tab = document.getElementsByClassName("tab-panel active")[0];
    let transformations = {};
    let GROUPS = [];
    let APPLY = [];
    let groups = tab.getElementsByClassName('form-group groups')[0].children[1].children;
    for (let group of groups) {
        if (group.children[0].getAttribute("checked") === "checked") {
            GROUPS.push(kind + "_" + group.children[0].getAttribute("value"));
        }
    }
    let container = tab.getElementsByClassName("transformations-container")[0].children;
    for (let applyRule of container) {
        let applyObj = {};
        let applyKey = applyRule.children[0].children[0].getAttribute("value");
        let token;
        let potentialTokens = applyRule.children[1].children[0].children;
        for (let potentialToken of potentialTokens) {
            if (potentialToken.getAttribute("selected") === "selected") {
                token = potentialToken.getAttribute("value");
            }
        }
        let key;
        let potentialKeys = applyRule.children[2].children[0].children;
        for (let potentialKey of potentialKeys) {
            if (potentialKey.getAttribute("selected") === "selected") {
                key = kind+"_"+potentialKey.getAttribute("value");
            }
        }
        let tokenKeyPair = {};
        tokenKeyPair[token] = key;
        applyObj[applyKey] = tokenKeyPair;
        APPLY.push(applyObj);
    }
    transformations["GROUP"] = GROUPS;
    transformations["APPLY"] = APPLY;
    return transformations;
}


