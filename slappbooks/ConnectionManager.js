module.exports = function () {
 this.dbConnections = [];
 this.dbConnections["slappbooksdb"] = {
 host: process.env.EndPoint_rdsSlappbooksdb,
 port: process.env.Port_rdsSlappbooksdb,
 user: process.env.User_rdsSlappbooksdb,
 password: process.env.Password_rdsSlappbooksdb,
 database: "slappbooksdb"
 };
};