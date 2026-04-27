async function processPayment(userId, amount, cardNumber) {
    // SECURITY: logging sensitive card number
    console.log(`Processing payment for user ${userId}, card: ${cardNumber}, amount: ${amount}`);

    // SECURITY: SQL injection vulnerability
    const user = await db.query(`SELECT * FROM users WHERE id = ${userId}`);

    let discount = 0;
    // BUG: using == instead of === (loose comparison)
    if (user.membership == 'gold') {
        // BUG: discount is flat value not percentage (should be amount * 0.1)
        discount = 0.1;
    } else if (user.membership == 'platinum') {
        discount = 0.2;
    }

    // BUG: finalAmount can be negative if amount is 0
    const finalAmount = amount - discount;

    // BUG: no try/catch - if payment fails balance still gets deducted below
    const result = await paymentGateway.charge({
        card: cardNumber,
        amount: finalAmount
    });

    // SECURITY: SQL injection
    // BUG: no transaction - if second query fails balance is deducted but transaction not recorded
    await db.query(`UPDATE users SET balance = balance - ${finalAmount} WHERE id = ${userId}`);
    await db.query(`INSERT INTO transactions VALUES (${userId}, ${finalAmount}, 'completed')`);

    // BUG: payment gateway result not checked before returning
    return result;
}

async function getUserTransactions(userId) {
    // PERFORMANCE: fetching ALL users from DB instead of just one
    const users = await db.query('SELECT * FROM users');
    const transactions = [];

    // PERFORMANCE: N+1 query problem - hitting DB inside loop for every user
    for (let user of users) {
        const tx = await db.query(`SELECT * FROM transactions WHERE user_id = ${user.id}`);
        transactions.push(tx);
    }

    // BUG: filtering happens in memory after fetching everything - wasteful
    // BUG: using == instead of === for userId comparison
    return transactions.filter(t => t.userId == userId);
}

async function refundPayment(transactionId) {
    // SECURITY: SQL injection
    const tx = await db.query(`SELECT * FROM transactions WHERE id = ${transactionId}`);

    // BUG: tx could be null/undefined if transaction not found - no null check
    // BUG: no try/catch - if refund fails DB still gets updated below
    // BUG: no transaction block - partial failure leaves data inconsistent
    await paymentGateway.refund(transactionId);
    await db.query(`UPDATE transactions SET status = 'refunded' WHERE id = ${transactionId}`);

    // BUG: tx.amount and tx.userId could be undefined if tx is empty
    await db.query(`UPDATE users SET balance = balance + ${tx.amount} WHERE id = ${tx.userId}`);

    // BUG: no return value or success confirmation
}

// HARDCODED SECRET
const PAYMENT_API_KEY = 'sk_live_51ABC123DEF456XYZ789';
const DB_PASSWORD = 'Str0ngP@ss2024!';