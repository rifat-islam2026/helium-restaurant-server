const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "simple-firebase-ebac4.web.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// verify jwt middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({ message: "unauthorized access" });
      }
      console.log(decoded);
      req.user = decoded;
      next();
    });
  }
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kkyxc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const foodsCollection = client.db("heliumRestaurant").collection("foods");
    const purchaseCollection = client
      .db("heliumRestaurant")
      .collection("purchase");
    const galleryCollection = client
      .db("heliumRestaurant")
      .collection("gallery");

    // jwt generate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });
      res.cookie("token", token, cookieOptions).send({ success: true });
    });
    //clearing Token
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    // cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    };

    // get alls foods
    app.get("/foods", async (req, res) => {
      const cursor = await foodsCollection.find().toArray();
      res.send(cursor);
    });
    // insert a food item
    app.post("/foods", async (req, res) => {
      const foodData = req.body;
      const result = await foodsCollection.insertOne(foodData);
      res.send(result);
    });
    // get a single food
    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });
    // insert a food purchase data
    app.post("/purchase", async (req, res) => {
      const purchaseDoc = req.body;
      console.log(purchaseDoc)
      const result = await purchaseCollection.insertOne(purchaseDoc);
      res.send(result);
    });
    // get a gallery data
    app.get("/gallery", async (req, res) => {
      const cursor = await galleryCollection.find().toArray();
      res.send(cursor);
    });
    // insert a gallery data
    app.post("/gallery", async (req, res) => {
      const galleryDoc = req.body;
      const result = await galleryCollection.insertOne(galleryDoc);
      res.send(result);
    });
    // get alls foods with specific user
    app.get("/my-added-foods/:email", verifyToken,async (req, res) => {
      const tokenEmail = req.user.email;
      const email = req.params.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });
    // get alls purchase data with specific user
    app.get("/purchase/:email",verifyToken, async (req, res) => {
     const tokenEmail = req.user.email;
      const email = req.params.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const result = await purchaseCollection.find(query).toArray();
      res.send(result);
    });
    // update a food
    app.put("/update/:id", async (req, res) => {
      const updateData = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...updateData,
        },
      };
      const result = await foodsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    // delete a my purchase food
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await purchaseCollection.deleteOne(query);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Helium Restaurant Is Running!");
});

app.listen(port, () => {
  console.log(`Helium Restaurant on port ${port}`);
});
