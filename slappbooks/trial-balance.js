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
 * Lambda function retrieves transactions in a report format. Events are submitted through the application as an identifier. 
 * An RDS instance is used for transaction retrieval. The lambda function prepares a Trial Balance using the data retrieved.
 *
 * @author Malith Jayaweera
 */
exports.handler = function (event, context, callback) {

	let spotRate = event.spotRate;
	let defaultCurrency = event.defaultCurrency;
	let entries = [];
	let sql = "SELECT E.name AS name, SUM( IF(T.is_credit='1', -1*(IF(E.currency!=?, T.amount*?, T.amount)), " +
		"IF(E.currency!=?, T.amount*?, T.amount))) AS value FROM transaction T INNER JOIN entity E on" +
		" T.entity_id=E.id LEFT JOIN conversion C on T.transaction_id=C.transaction_id GROUP BY E.id;";
	let currencyArray = [defaultCurrency, spotRate, defaultCurrency, spotRate];

	rds.query({
		instanceIdentifier: 'slappbooksdb',
		query: sql,
		inserts: currencyArray
	}, function (error, results, connection) {
		if (error) {
			console.log("Error occurred while preparing the trial balance", error);
			throw error;
		} else {
			console.log("Successfully prepared the trial balance")
			console.log(results);
			results.forEach(result => {
				let entry = {
					name: result.name,
					isCredit: result.value < 0 ? true : false,
					value: Math.abs(result.value)
				}
				entries.push(entry);
			});
		}
		connection.end();
		callback(error, entries);
	});
}