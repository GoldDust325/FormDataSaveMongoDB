const { MongoClient } = require('mongodb');
const { uri } = require('./controllers/databaseConnection');
const customers = require('./platepal-customers.json');

async function importCustomers() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas!');

        const db = client.db('platepal');
        const collection = db.collection('customers');

        // Avoid inserting duplicate customers if run again.
        const emails = customers.map(customer => customer.email);

        const existing = await collection
            .find({ email: { $in: emails } })
            .project({ email: 1 })
            .toArray();

        const existingEmails = new Set(
            existing.map(customer => customer.email)
        );

        const newCustomers = customers.filter(
            customer => !existingEmails.has(customer.email)
        );

        if (newCustomers.length > 0) {
            const result = await collection.insertMany(newCustomers);
            console.log(`${result.insertedCount} customers added!`);
        } else {
            console.log('All customers already exist.');
        }

        const total = await collection.countDocuments();
        console.log(`Total PlatePal customers: ${total}`);

    } catch (error) {
        console.error('Import failed:', error.message);
        process.exitCode = 1;
    } finally {
        await client.close();
    }
}

importCustomers();