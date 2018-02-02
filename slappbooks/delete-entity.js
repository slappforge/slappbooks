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
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);

/**
 * Lambda function handles entity deletion. Events are submitted through the application as entity objects 
 * An RDS instance is used for entity deletion.
 *
 * @author Malith Jayaweera
 */
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