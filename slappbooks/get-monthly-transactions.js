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
 * Lambda function retrieves transactions month wise while supporting pagination. Events are submitted through the application as an identifier. 
 * An RDS instance is used for transaction retrieval.
 *
 * @author Malith Jayaweera
 */
exports.handler = function (event, context, callback) {

	let postObject = event;
	let entityName = postObject.entity;
	let pageNo = postObject.page;
	let pageSize = postObject.pageSize;
	let sorted = postObject.sorted;
	let filtered = postObject.filtered;
	let startIndex = +pageNo * +pageSize;
	let endIndex = startIndex + pageSize;
	let pageNumber = 1;
	let year = postObject.year;
	let month = postObject.month;

	// retrieve transactions between the selected time frame
	let sql = 'SELECT * FROM transaction T INNER JOIN entity E ON T.entity_id = E.id WHERE E.name =? AND date BETWEEN ? AND ?  LIMIT ?,?';
	let entityArray = [entityName, year.concat("-").concat(month).concat("-01"), year.concat("-").concat(month).concat("-31")];
	
	rds.query({
		instanceIdentifier: 'slappbooksdb',
		query: 'SELECT count(*) as count FROM transaction T INNER JOIN entity E ON T.entity_id = E.id WHERE E.name=? AND date BETWEEN ? AND ?',
		inserts: entityArray
	}, function (error, results, connection) {
		if (error) {
			console.log("Error occurred while retrieving count");
			throw error;
		} else {
			console.log("Successfully obtained database count");
			console.log(results[0].count);
			pageNumber = Math.ceil(parseFloat(results[0].count) / parseFloat(pageSize));

			let transactionQueryArray = [entityName, year.concat("-").concat(month).concat("-01"), year.concat("-").concat(month).concat("-31"), startIndex, pageSize];
			// retrieve transactions between a given time frame
			rds.query({
				instanceIdentifier: 'slappbooksdb',
				query: sql,
				inserts: transactionQueryArray
			}, function (error, results, connection) {
				if (error) {
					console.log("Error occurred while retreiving transactions", error);
					throw error;
				} else {
					let transactions = [];
					transactionResult = results;
					console.log(transactionResult);
					console.log("Successfully retreived transactions");
					if (startIndex == 0) {

						let amountSql = 'SELECT SUM( IF (T.is_credit = 1, -1 * amount,  amount) ) as amount FROM transaction T INNER JOIN entity E ON T.entity_id = E.id WHERE E.name = ? AND date < ?;';
						let amountQueryArray = [entityName, year.concat("-").concat(month).concat("-01")];
						// Generate the required credit and debit balances to formulate the balance brought forward query
						rds.query({
							instanceIdentifier: 'slappbooksdb',
							query: amountSql,
							inserts: amountQueryArray
						}, function (error, resultAmount, connection) {
							if (error) {
								console.log("Error occurred while retrieving the amount as balance brought forward", error);
								throw error;
							} else {
								console.log("Successfully retreived the amount as balance brought forward");
								console.log(resultAmount);
								let amount = resultAmount[0].amount;
								amount = amount === null ? 0 : amount;

								transactions.push({
									trId: '00000000000000000',
									notes: 'Balance Brought Forward',
									date: year.concat("-").concat(month).concat("-01"),
									isCredit: amount < 0 ? 1 : 0,
									amount: Math.abs(amount),
									entityName: entityName
								});
								console.log(transactionResult);
								transactionResult.forEach(result => {
									transactions.push({
										trId: result.transaction_id,
										date: result.date,
										checkNo: result.cheque_no,
										voucherNo: result.voucher_no,
										isCredit: result.is_credit,
										amount: result.amount,
										notes: result.notes,
										reconcile: result.reconcile,
										setId: result.set_id,
										entityName: entityName
									});
								});
								let finalResult = { rows: transactions, pages: pageNumber }
								console.log(finalResult);
								connection.end();
								callback(null, finalResult);
							}
						}, connection);

					} else {
						results.forEach(result => {
							transactions.push({
								trId: result.transaction_id,
								date: result.date,
								checkNo: result.cheque_no,
								voucherNo: result.voucher_no,
								isCredit: result.is_credit,
								amount: result.amount,
								notes: result.notes,
								reconcile: result.reconcile,
								setId: result.set_id,
								entityName: entityName
							});
						});
						let finalResult = { rows: transactions, pages: pageNumber }
						console.log(finalResult);
						connection.end();
						callback(error, finalResult);
					}
				}
			}, connection);
		}
	});
}