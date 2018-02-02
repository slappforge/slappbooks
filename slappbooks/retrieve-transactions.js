let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);

exports.handler = function (event, context, callback) {

	console.log(event);
	let postObject = event;
	let entityName = postObject.entity;
	let pageNo = postObject.page;
	let pageSize = postObject.pageSize;
	let sorted = postObject.sorted;
	let filtered = postObject.filtered;
	let startIndex = +pageNo * +pageSize;
	let endIndex = startIndex + pageSize;
	let pageNumber = 1;

	// Retrieve all transactions limited by the start index and page size
	let sql = 'SELECT * FROM transaction T INNER JOIN entity E ON T.entity_id = E.id WHERE E.name = ? LIMIT ?,?';

	rds.query({
		instanceIdentifier: 'slappbooksdb',
		query: 'SELECT count(*) as count FROM transaction;'
	}, function (error, results, connection) {
		if (error) {
			console.log("Error occurred while retrieving count", error);
			throw error;
		} else {
			console.log("Successfully obtained database count");
			console.log(results[0].count);
			pageNumber = Math.ceil(parseFloat(results[0].count) / parseFloat(pageSize));

			let queryArray = [entityName, startIndex, pageSize];
			rds.query({
				instanceIdentifier: 'slappbooksdb',
				query: sql,
				inserts: queryArray
			}, function (error, results, connection) {
				if (error) {
					console.log("Error occurred while retreiving transactions", error);
					throw error;
				} else {
					let transactions = [];
					console.log("Successfully retreived transactions");
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
			}, connection);
		}
	});
}