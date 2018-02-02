let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);

exports.handler = function (event, context, callback) {

    let transactionId = event.queryStringParameters.id;

    let sql = 'SELECT T.transaction_id, T.set_id, T.date, T.cheque_no, T.is_credit, T.amount, T.notes, T.reconcile, E.name FROM ' +
        'transaction T INNER JOIN entity E on T.entity_id=E.id where T.set_id=?;';
    let transactionIdArray = [transactionId];
    
    rds.query({
        instanceIdentifier: 'slappbooksdb',
        query: sql,
        inserts: transactionIdArray
    }, function (error, results, connection) {
        if (error) {
            console.log("Error occurred while retrieving the transaction with set_id", transactionId, error);
            throw error;
        } else {
            console.log("Successfully retrieved the transaction")
            let transactions = [];
            results.forEach(result => {
                transactions.push({
                    trId: result.transaction_id,
                    setId: result.setId,
                    date: result.date,
                    checkNo: result.cheque_no,
                    voucherNo: result.voucher_no,
                    isCredit: result.is_credit,
                    amount: result.amount,
                    notes: result.notes,
                    reconcile: result.reconcile,
                    entityName: result.name
                });
            });
            console.log(transactions);
            connection.end();
            callback(null, {
                "statusCode": 200,
                "headers": {
                    "app_header": "slappbooks",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": JSON.stringify(transactions),
                "isBase64Encoded": false
            });
        }
    });
}