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
 * Lambda function handles entity creation. Events are submitted through the application as entity objects 
 * An RDS instance is used for entity creation.
 *
 * @author Malith Jayaweera
 */
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