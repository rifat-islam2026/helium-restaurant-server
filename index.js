const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
  ],
  credentials: true,
}))
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kkyxc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const foodsCollection = client.db('heliumRestaurant').collection('foods');
    const purchaseCollection = client.db('heliumRestaurant').collection('purchase');
    const galleryCollection = client.db('heliumRestaurant').collection('gallery');

    // get alls foods
    app.get('/foods', async (req, res) => {
      const cursor = await foodsCollection.find().toArray()
      res.send(cursor)
    })
    // insert a food item
    app.post('/foods', async (req, res) => {
      const foodData = req.body
      console.log(foodData)
      const result = await foodsCollection.insertOne(foodData)
      res.send(result)
    })
    // get a single food with: _id
    app.get('/food/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query)
      res.send(result)
    })
    // insert a food purchase data
    app.post('/purchase', async (req, res) => {
      const purchaseDoc = req.body
      console.log(purchaseDoc)
      const result = await purchaseCollection.insertOne(purchaseDoc)
      res.send(result)
    })
    // get a gallery data
    app.get('/gallery', async (req, res) => {
      const cursor = await galleryCollection.find().toArray()
      res.send(cursor)
    })
    // insert a gallery data
    app.post('/gallery', async (req, res) => {
      const galleryDoc = req.body
      console.log(galleryDoc)
      const result = await galleryCollection.insertOne(galleryDoc)
      res.send(result)
    })
    // get my adding food with: email
    app.get('/my-added-foods/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email)
      const query = { email: email };
      const result = await foodsCollection.find(query).toArray()
      res.send(result)
    })

    app.put('/update/:id', async (req, res) => {
      const updateData = req.body;
      const id = req.params.id;
      console.log(updateData)
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...updateData 
        },
      };
      const result = await foodsCollection.updateOne(filter, updateDoc, options);
      res.send(result)

    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Helium Restaurant Is Running!')
})

app.listen(port, () => {
  console.log(`Helium Restaurant on port ${port}`)
})