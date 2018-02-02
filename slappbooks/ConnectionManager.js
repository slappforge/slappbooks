module.exports = function () {

    this.dbConnections = [];

    this.dbConnections["slappbooksdb"] = {
        host: process.env.EndPoint_slappbooksdb,
        port: "3306",
        user: "slappbooksuser",
        password: "12345678",
        database: "slappbooksdb",
    };

};