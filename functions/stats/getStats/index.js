const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const dynamo = require('../../../utils/dynamodb');
const { success, error, getUserId } = require('../../../utils/responses');

module.exports.handler = async (event) => {
  try {
    const userId = getUserId(event);

    const habitsResult = await dynamo.send(new QueryCommand({
      TableName: process.env.HABITS_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }));

    const habits = habitsResult.Items || [];
    if (habits.length === 0) {
      return success({ habits: [], summary: {} });
    }

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

    const logsPromises = habits.map((habit) =>
      dynamo.send(new QueryCommand({
        TableName: process.env.LOGS_TABLE,
        KeyConditionExpression: 'habitId = :hid AND #d BETWEEN :from AND :to',
        ExpressionAttributeNames: { '#d': 'date' },
        ExpressionAttributeValues: {
          ':hid': habit.habitId,
          ':from': fromDate,
          ':to': today,
        },
      })).then((r) => ({ habitId: habit.habitId, logs: r.Items || [] }))
    );

    const allLogs = await Promise.all(logsPromises);

    const habitStats = habits.map((habit) => {
      const logsEntry = allLogs.find((l) => l.habitId === habit.habitId);
      const logs = logsEntry?.logs || [];
      const completionRate = Math.round((logs.length / 30) * 100);

      return {
        habitId: habit.habitId,
        name: habit.name,
        streak: habit.streak || 0,
        totalCompleted: habit.totalCompleted || 0,
        last30Days: logs.length,
        completionRate,
        completedDates: logs.map((l) => l.date),
      };
    });

    const summary = {
      totalHabits: habits.length,
      avgCompletionRate: Math.round(
        habitStats.reduce((sum, h) => sum + h.completionRate, 0) / habits.length
      ),
      bestStreak: Math.max(...habitStats.map((h) => h.streak)),
    };

    return success({ habits: habitStats, summary });
  } catch (err) {
    console.error(err);
    return error('Kunde inte hämta statistik');
  }
};