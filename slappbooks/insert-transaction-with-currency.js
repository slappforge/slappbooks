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
 * Lambda function handles transaction inserts. Events are submitted through the application as transaction objects. 
 * An RDS instance is used for transaction inserts. Currency differences are also handled through this lambda function as opposed to a usual 
 * transaction insert.Transactional behaviour is guaranteed for the insert.
 *
 * @author Malith Jayaweera
 */
exports.handler = function (event, context, callback) {

	postObject = event;
	transactions = postObject.transactions;
	conversions = postObject.conversionDetails;
	console.log(conversions);

	transactions.forEach((transaction, index) => {
		if ((transaction.amount).toString().startsWith("(") && transaction.amount.toString().endsWith(")")) {
			transaction.amount = transaction.amount.slice(1, transaction.amount.length - 1);
		}
		transaction.isCredit = transaction.isCredit ? 1 : 0;
	});
	let entity_id;

	rds.beginTransaction({
		instanceIdentifier: 'slappbooksdb'
	}, function (error, connection) {
		if (error) { throw err; }

		let sql = 'INSERT INTO transaction (transaction_id, set_id, date, entity_id, is_credit, cheque_no, voucher_no, amount, notes,' +
			' reconcile) VALUES (?,?,?,?,?, ?, ?, ?, ?, ?);';
		let entityArray = [transaction.entityName];
		transactions.forEach((transaction, index) => {
			rds.query({
				instanceIdentifier: 'slappbooksdb',
				query: 'SELECT id FROM entity WHERE name = ?',
				inserts: entityArray
			}, function (error, results, connection) {
				if (error) {
					console.log("Error occurred while retreiving the entity id from the database", error);
					connection.rollback();
					connection.end();
					throw error;
				} else {
					console.log("Successfully retrieved the entity id")
					entity_id = results[0].id;
					console.log(transaction.trId);

					let transactionInsertArray = [transaction.trId, transaction.setId, transaction.date, entity_id, transaction.isCredit, transaction.checkNo, transaction.voucherNo, transaction.amount, transaction.notes, transaction.reconcile];
					rds.query({
						identifier: 'slappbooksdb',
						query: sql,
						inserts: transactionInsertArray
					}, function (error, results, connection) {
						if (error) {
							connection.rollback();
							connection.end();
							console.log("Error occurred while inserting the transaction", error);
							throw error;
						} else {
							console.log("Successfully inserted the transaction")
							console.log(results);
							sql = 'INSERT INTO conversion (transaction_id, to_currency, from_currency, rate) VALUES (?,?,?,?)';
							let conversionInsertArray = [transaction.trId, conversions[index]._toCurrency, conversions[index]._fromCurrency, conversions[index]._conversionRate];
							rds.query({
								instanceIdentifier: 'slappbooksdb',
								query: sql,
								inserts: conversionInsertArray
							}, function (error, results, connection) {
								if (error) {
									connection.rollback();
									connection.end();
									console.log("Error occurred while inserting conversions");
									throw error;
								} else {
									console.log("Successfully inserted a conversion object");
									console.log(results);
								}
							}, connection);
						}

						if (index === transactions.length - 1) {
							connection.commit();
							connection.end();
							callback(error, JSON.stringify(event));
						}
					}, connection);
				}
			}, connection);
		});
	});
}