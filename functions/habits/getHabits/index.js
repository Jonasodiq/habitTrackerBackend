const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const dynamo = require('../../../utils/dynamodb');
const { success, error, getUserId } = require('../../../utils/responses');

module.exports.handler = async (event) => {
  try {
    const userId = getUserId(event);

    const result = await dynamo.send(new QueryCommand({
      TableName: process.env.HABITS_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }));

    return success(result.Items || []);
  } catch (err) {
    console.error(err);
    return error('Kunde inte hämta vanor');
  }
};