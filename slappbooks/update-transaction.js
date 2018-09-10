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
 * Lambda function handles transaction updates. Events are submitted through the application as transaction objects. 
 * An RDS instance is used for transaction updates. Transactional behaviour is guaranteed for the update.
 *
 * @author Malith Jayaweera
 */
exports.handler = function (event, context, callback) {

	let transactions = event.slice();
	transactions.forEach(transaction => {
		if ((transaction.amount).toString().startsWith("(") && transaction.amount.toString().endsWith(")")) {
			transaction.amount = transaction.amount.slice(1, transaction.amount.length - 1);
		}
		transaction.isCredit = transaction.isCredit ? 1 : 0;
	});

	rds.beginTransaction({
		instanceIdentifier: 'slappbooksdb'
	}, function (error, connection) {
		if (error) { connection.rollback(); throw error; }

		// Insert transactions to the database 
		transactions.forEach((transaction, index) => {
			let entityArray = [transaction.entityName];

			rds.query({
				instanceIdentifier: 'slappbooksdb',
				query: 'SELECT id FROM entity WHERE name = ?',
				inserts: entityArray
			}, function (error, results, connection) {
				if (error) {
					console.log("Error occurred while retreiving the entity id from the database", error);
					connection.rollback();
					throw error;
				} else {
					console.log("Successfully retrieved the entity id")
					let entity_id = results[0].id;
					console.log(transaction.trId);

					let sql = 'UPDATE transaction SET transaction_id=?, set_id=?, date=?, entity_id=?, is_credit=?, cheque_no=?, voucher_no=?, amount=?, notes=?, reconcile=? WHERE transaction_id=?';
					let updateArray = [transaction.trId, transaction.setId, transaction.date, entity_id, transaction.isCredit, transaction.checkNo, transaction.voucherNo, transaction.amount, transaction.notes, transaction.reconcile, transaction.trId];
					rds.query({
						instanceIdentifier: 'slappbooksdb',
						query: sql,
						inserts: updateArray
					}, function (error, results, connection) {
						if (error) {
							connection.rollback();
							console.log("Error occurred while updating the transaction", error);
							callback(error, JSON.stringify(event));
							throw error;
						} else {
							console.log("Successfully updated the transaction");
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