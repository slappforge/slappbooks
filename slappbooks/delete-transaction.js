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
 * Lambda function handles deleting a transaction. Events are submitted through the application as a transaction identifier. 
 * An RDS instance is used for transaction deletion. Transactional behaviour is guaranteed for a delete.
 *
 * @author Malith Jayaweera
 */
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