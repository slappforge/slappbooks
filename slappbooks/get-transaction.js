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
 * Lambda function retrieves a transaction. Events are submitted through the application as an identifier. 
 * An RDS instance is used for transaction retrieval.
 *
 * @author Malith Jayaweera
 */
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