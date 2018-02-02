let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);

exports.handler = function (event, context, callback) {

	let setId = event.setId;

	rds.beginTransaction({
		instanceIdentifier: 'slappbooksdb'
	}, function (error, connection) {
		if (error) { throw err; }

		let sql = 'DELETE FROM transaction WHERE set_id=?';
		let setIdArray = [setId];
		// Delete a transaction from the database
		rds.query({
			instanceIdentifier: 'slappbooksdb',
			query: sql,
			inserts: setIdArray
		}, function (error, results, connection) {
			if (error) {
				connection.rollback();
				connection.end();
				console.log("Error occurred while deleting the transaction with set id", setId, error);
				callback(error, JSON.stringify(event));
				throw error;
			} else {
				connection.commit();
				connection.end();
				console.log("Successfully deleted the transaction with set id", setId);
				callback(null, JSON.stringify(event));
			}
		}, connection);

	});
}