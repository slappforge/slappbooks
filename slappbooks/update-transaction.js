let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);

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