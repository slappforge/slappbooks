let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);

exports.handler = function (event, context, callback) {

	let entity = event;

	let sql = 'INSERT INTO entity (name, currency, type) values (?, ?, ?)';
	let entityArray = [entity.entity, entity.currency, entity.entityType];

	// Insert entity value to the database
	rds.query({
		instanceIdentifier: 'slappbooksdb',
		query: sql,
		inserts: entityArray
	}, function (error, results, connection) {
		if (error) {
			console.log("Error occurred while inserting the entity", error);
			connection.end();
			callback(error, JSON.stringify({ error: "Error occurred while inserting the entity" }));
			throw error;
		} else {
			console.log("Successfully inserted the entity");
			connection.end();
			callback(error, JSON.stringify({ success: "successfully created the entity" }));
		}
	});
}