module.exports = {
    fcProvider: require("./FormatCheck.provider"),
    /**
     * @type function(provider: Generator)
     */
    getTableFromProvider: require("./getTable"),
};