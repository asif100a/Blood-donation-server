require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://blood-donator-unity.web.app'
    ]
}));
app.use(express.json());


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.bu1vbif.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // Database collections
        const userCollection = client.db('bloodDonationDB').collection('users');
        const donationRequestCollection = client.db('bloodDonationDB').collection('donationRequests');
        const blogCollection = client.db('bloodDonationDB').collection('blogs');

        // -------------------[Users info]----------------------
        // Create user data to the db
        app.post('/users', async (req, res) => {
            const userInfo = req.body;
            // console.log(userInfo)
            const result = await userCollection.insertOne(userInfo);
            res.send(result);
        });

        // Read users data from the db
        app.get('/users', async(req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        // Read specific user by email
        app.get('/users/:email', async(req, res) => {
            const email = req.params.email;
            const filter = {email};
            const result = await userCollection.findOne(filter);
            res.send(result);
        });

        // Update user's status
        app.patch('/users-update-status/:email', async(req, res) => {
            const email = req.params.email;
            const status = req.body;
            const filter = {email};
            console.log(filter);
            const updatedDoc = {
                $set: {...status}
            };
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        // Update user's role
        app.patch('/users-update-role/:email', async(req, res) => {
            const email = req.params.email;
            const role = req.body;
            const filter = {email};
            console.log(filter);
            const updatedDoc = {
                $set: {...role}
            };
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        // -------------------[Donation request data]------------------------
        // Read all the donation requests data from the db
        app.get('/donation-requests', async(req, res) => {
            const result = await donationRequestCollection.find().toArray();
            res.send(result);
        });
        
        // Read the donation requests data based on the email from the db
        app.get('/donation-requests/:email', async (req, res) => {
            const email = req.params.email;
            const {status} = req.query;
            console.log(status)
            if (email) {
                const filter = { requester_email: email }
                const result = await donationRequestCollection.find(filter).toArray();
                // If status then filter data based on the status
                if(status) {
                    const filteredData = result.filter(data => data.donation_status === status);
                    console.log(filteredData)
                    res.send(filteredData);

                } else{
                    res.send(result);
                }
            }
        });

        // Read the recent donation requests data from the db
        app.get('/recent-requests/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { requester_email: email }
            // console.log('User email filter', filter);
            const recentData = await donationRequestCollection.find(filter).sort({ selectedDate: -1 }).limit(3).toArray();
            res.send(recentData);
        });

        // Read a single data to update data
        app.get('/donation-requests-field/:id', async(req, res) => {
            const id = req.params.id;
            // console.log('update id:', id);
            const query = {_id: new ObjectId(id)};
            const result = await donationRequestCollection.findOne(query);
            res.send(result);
        })

        // Create the donation request data to the db
        app.post('/donation-requests', async (req, res) => {
            const data = req.body;
            const result = await donationRequestCollection.insertOne(data);
            res.send(result);
        });

        // Update the donation request to the db
        app.patch('/donation-requests/:id', async(req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = {_id: new ObjectId(id)};
            const updatedDoc = {
                $set: {
                    ...data
                }
            };
            const result = await donationRequestCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        // Update a single field of donation request
        app.patch('/donation-requests-status/:id', async(req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = {_id: new ObjectId(id)};
            const updatedDoc = {
                $set: {...data}
            };
            const result = await donationRequestCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        // Delete a donation request data from the db
        app.delete('/donation-requests/:id', async(req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const result = await donationRequestCollection.deleteOne(filter);
            res.send(result);
        });

        // ---------------------[Blogs Data]---------------------
        // Read the blogs from the db
        app.get('/blogs', async(req, res) => {
            const result = await blogCollection.find().toArray();
            res.send(result);
        });
        
        // Create a blog to the db
        app.post('/blogs', async(req, res) => {
            const blog = req.body;
            console.log(blog);
            const result = await blogCollection.insertOne(blog);
            res.send(result)
        });

        // Update blog to publish blog
        app.patch('/blogs/:id', async(req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = {_id: new ObjectId(id)};
            const updatedDoc = {
                $set: {...data}
            };
            const result = await blogCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        // Delete a blog from the db
        app.delete('/blogs/:id', async(req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            console.log('deleted id:', id);
            const result = await blogCollection.deleteOne(filter);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


// Get the data to the server
app.get('/', (req, res) => {
    res.send('Blood donation server is running --->');
});

// Listen the server
app.listen(port, () => {
    console.log(`Blood donation server is running on port ${port}`);
});