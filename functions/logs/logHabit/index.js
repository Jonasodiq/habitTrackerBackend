const { PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const dynamo = require('../../../utils/dynamodb');
const { success, error, getUserId } = require('../../../utils/responses');

module.exports.handler = async (event) => {
  try {
    const userId = getUserId(event);
    const { habitId } = event.pathParameters;
    const today = new Date().toISOString().split('T')[0];

    // Kolla om redan loggad idag
    const existing = await dynamo.send(new QueryCommand({
      TableName: process.env.LOGS_TABLE,
      KeyConditionExpression: 'habitId = :hid AND #d = :date',
      ExpressionAttributeNames: { '#d': 'date' },
      ExpressionAttributeValues: { ':hid': habitId, ':date': today },
    }));

    if (existing.Items.length > 0) {
      return error('Redan markerad som klar idag', 409);
    }

    // Spara log
    await dynamo.send(new PutCommand({
      TableName: process.env.LOGS_TABLE,
      Item: { habitId, date: today, userId, completedAt: new Date().toISOString() },
    }));

    // Uppdatera streak
    await dynamo.send(new UpdateCommand({
      TableName: process.env.HABITS_TABLE,
      Key: { userId, habitId },
      UpdateExpression: 'SET streak = if_not_exists(streak, :zero) + :one, totalCompleted = if_not_exists(totalCompleted, :zero) + :one',
      ExpressionAttributeValues: { ':one': 1, ':zero': 0 },
    }));

    return success({ message: 'Vana markerad som klar!', date: today }, 201);
  } catch (err) {
    console.error(err);
    return error('Kunde inte logga vana');
  }
};