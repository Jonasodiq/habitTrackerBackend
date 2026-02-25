const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const dynamo = require('../../../utils/dynamodb');
const { success, error, getUserId } = require('../../../utils/responses');

module.exports.handler = async (event) => {
  try {
    const userId = getUserId(event);
    const body = JSON.parse(event.body);

    if (!body.name) return error('name krävs', 400);

    const habit = {
      userId,
      habitId: randomUUID(),
      name: body.name,
      createdAt: new Date().toISOString(),
      streak: 0,
      totalCompleted: 0,
    };

    await dynamo.send(new PutCommand({
      TableName: process.env.HABITS_TABLE,
      Item: habit,
    }));

    return success(habit, 201);
  } catch (err) {
    console.error(err);
    return error('Kunde inte skapa vana');
  }
};