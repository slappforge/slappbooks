let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);

exports.handler = function (event, context, callback) {

	let entityName = event.entityName;

	rds.beginTransaction({
		instanceIdentifier: 'slappbooksdb'
	}, function (error, connection) {
		if (error) { throw err; }
		let entityArray = [entityName];
		rds.query({
			instanceIdentifier: 'slappbooksdb',
			query: 'DELETE t2 FROM transaction t1 INNER JOIN entity e ON t1.entity_id=e.id INNER JOIN transaction t2 ON t1.set_id=t2.set_id WHERE e.name=?',
			inserts: entityArray
		}, function (error, results, connection) {
			if (error) {
				connection.rollback();
				console.log("Error occurred while deleting transactions from transaction table");
				throw error;
			} else {
				console.log("Successfully deleted the transactions");
				console.log(results);

				rds.query({
					instanceIdentifier: 'slappbooksdb',
					query: 'DELETE FROM entity WHERE name=?',
					inserts: entityArray
				}, function (error, results, connection) {
					if (error) {
						connection.rollback();
						console.log("Error occurred while deleting the entity ", entityName);
						callback(error, JSON.stringify(event));
						throw error;
					} else {
						connection.commit();
						console.log("Successfully deleted the entity ", entityName);
						connection.end();
						callback(error, JSON.stringify(event));
					}

				}, connection);
			}
		}, connection);

	});
}