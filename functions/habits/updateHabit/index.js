const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const dynamo = require('../../../utils/dynamodb');
const { success, error, getUserId } = require('../../../utils/responses');

module.exports.handler = async (event) => {
  try {
    const userId = getUserId(event);
    const { habitId } = event.pathParameters;
    const body = JSON.parse(event.body);

    if (!body.name) return error('name krävs', 400);

    const result = await dynamo.send(new UpdateCommand({
      TableName: process.env.HABITS_TABLE,
      Key: { userId, habitId },
      UpdateExpression: 'SET #n = :name, updatedAt = :ts',
      ExpressionAttributeNames: { '#n': 'name' },
      ExpressionAttributeValues: {
        ':name': body.name,
        ':ts': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }));

    return success(result.Attributes);
  } catch (err) {
    console.error(err);
    return error('Kunde inte uppdatera vana');
  }
};