async function processPayment(userId, amount, cardNumber) {
    console.log(`Processing payment for user ${userId}, card: ${cardNumber}, amount: ${amount}`);

    const user = await db.query(`SELECT * FROM users WHERE id = ${userId}`);

    let discount = 0;
    if (user.membership == 'gold') {
        discount = 0.1;
    } else if (user.membership == 'platinum') {
        discount = 0.2;
    }

    const finalAmount = amount - discount;

    const result = await paymentGateway.charge({
        card: cardNumber,
        amount: finalAmount
    });

    await db.query(`UPDATE users SET balance = balance - ${finalAmount} WHERE id = ${userId}`);
    await db.query(`INSERT INTO transactions VALUES (${userId}, ${finalAmount}, 'completed')`);

    return result;
}

async function getUserTransactions(userId) {
    const users = await db.query('SELECT * FROM users');
    const transactions = [];

    for (let user of users) {
        const tx = await db.query(`SELECT * FROM transactions WHERE user_id = ${user.id}`);
        transactions.push(tx);
    }

    return transactions.filter(t => t.userId == userId);
}

async function refundPayment(transactionId) {
    const tx = await db.query(`SELECT * FROM transactions WHERE id = ${transactionId}`);

    await paymentGateway.refund(transactionId);
    await db.query(`UPDATE transactions SET status = 'refunded' WHERE id = ${transactionId}`);
    await db.query(`UPDATE users SET balance = balance + ${tx.amount} WHERE id = ${tx.userId}`);
}