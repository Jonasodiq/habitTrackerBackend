const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const dynamo = require('../../../utils/dynamodb');
const { success, error } = require('../../../utils/responses');

module.exports.handler = async (event) => {
  try {
    const { habitId } = event.pathParameters;

    const result = await dynamo.send(new QueryCommand({
      TableName: process.env.LOGS_TABLE,
      KeyConditionExpression: 'habitId = :hid',
      ExpressionAttributeValues: { ':hid': habitId },
      ScanIndexForward: false,
    }));

    return success(result.Items || []);
  } catch (err) {
    console.error(err);
    return error('Kunde inte hämta loggar');
  }
};