const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const dynamo = require('../../../utils/dynamodb');
const { success, error, getUserId } = require('../../../utils/responses');

module.exports.handler = async (event) => {
  try {
    const userId = getUserId(event);
    const { habitId } = event.pathParameters;

    await dynamo.send(new DeleteCommand({
      TableName: process.env.HABITS_TABLE,
      Key: { userId, habitId },
    }));

    return success({ message: 'Vana borttagen' });
  } catch (err) {
    console.error(err);
    return error('Kunde inte ta bort vana');
  }
};