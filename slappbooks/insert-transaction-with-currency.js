let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);

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