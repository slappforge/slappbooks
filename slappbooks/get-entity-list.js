let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);

exports.handler = function (event, context, callback) {

	let sql = 'SELECT * FROM entity;'

	// Retrieve the entity objects 
	rds.query({
		instanceIdentifier: 'slappbooksdb',
		query: sql
	}, function (error, results, connection) {
		if (error) {
			console.log("Error occurred while retrieving entities", error);
			throw error;
		} else {
			console.log("Successfully retrieved entities")
			console.log(results);
			let entities = [];
			results.forEach(result => {
				entities.push({
					entityName: result.name,
					entityType: result.type,
					defaultCurrency: result.currency
				});
			});
			console.log(entities);
			connection.end();
			callback(error, {
				"statusCode": 200,
				"headers": {
					"app_header": "slappbooks",
					"Access-Control-Allow-Origin": "*"
				},
				"body": JSON.stringify(entities),
				"isBase64Encoded": false
			});
		}
	});
}