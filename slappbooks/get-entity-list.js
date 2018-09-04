/*
 * Copyright (c) 2018 SLAppForge Lanka (Private) Limited. All Rights Reserved.
 * https://www.slappforge.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. 
 */

let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL_AWS = require('slappforge-sdk-aws');
const rds = new SL_AWS.RDS(connectionManager);

/**
 * Lambda function handles entity retrieval.
 * An RDS instance is used for entity retrieval.
 *
 * @author Malith Jayaweera
 */
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