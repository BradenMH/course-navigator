/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    let xmlHttpRequest = new XMLHttpRequest();
    return new Promise (function (fulfill, reject) {
        xmlHttpRequest.open ("POST", "/query", true);
        xmlHttpRequest.onload = function (response) {
            return fulfill (response);
        };
        xmlHttpRequest.send (JSON.stringify(query));
        return reject ("sendQuery failed");
    });
};
