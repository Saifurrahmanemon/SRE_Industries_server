const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
//PORT
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

//  jwt verification
function verifyJWT(req, res, next) {
   const authHeader = req.headers.authorization;
   if (!authHeader) {
      return res.status(401).send({ message: "unauthorized access" });
   }
   const token = authHeader.split(" ")[1];
   jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
      if (err) {
         return res
            .status(403)
            .send({ message: "can not go further!!😕 forbidden access" });
      }

      req.decoded = decoded;
      next();
   });
}
//DATABASE

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   serverApi: ServerApiVersion.v1,
});

const run = async () => {
   try {
      await client.connect();
      console.log("MongoDB connected");
      const PartsCollection = client.db("SRE-Industries").collection("parts");
      const UsersCollection = client.db("SRE-Industries").collection("users");
      const OrdersCollection = client.db("SRE-Industries").collection("orders");
      const reviewsCollection = client
         .db("SRE-Industries")
         .collection("reviews");

      //ROUTES

      //GET ALL PARTS
      app.get("/parts", async (req, res) => {
         const parts = await PartsCollection.find({}).toArray();
         res.send(parts);
      });

      //GET PART BY ID
      app.get("/parts/:id", verifyJWT, async (req, res) => {
         const part = await PartsCollection.findOne({
            _id: ObjectId(req.params.id),
         });
         res.send(part);
      });

      //REVIEW

      //POST REVIEW
      app.post("/reviews", verifyJWT, async (req, res) => {
         const review = req.body;
         const result = await reviewsCollection.insertOne(review);
         res.send(result);
      });
      //GET ALL REVIEWS
      app.get("/reviews", verifyJWT, async (req, res) => {
         const reviews = await reviewsCollection.find({}).toArray();
         res.send(reviews);
      });

      // ORDERS

      //GET  ORDER BY USER EMAIL
      app.get("/orders/:email", verifyJWT, async (req, res) => {
         const orders = await OrdersCollection.find({
            email: req.params.email,
         }).toArray();

         res.send(orders);
      });

      //DELETE ORDER
      app.delete("/orders/:id", verifyJWT, async (req, res) => {
         const id = req.params.id;
         const deleted = await OrdersCollection.deleteOne({
            _id: ObjectId(id),
         });
         res.send(deleted);
         console.log(deleted);
      });

      //POST ORDER BY EMAIL
      //?USER CAN NOT ORDER SAME PRODUCT TWICE
      app.post("/orders", verifyJWT, async (req, res) => {
         const order = req.body;
         const query = {
            productId: order.productId,
            email: order.email,
         };
         const exist = await OrdersCollection.findOne(query);

         if (
            exist?.productId === order?.productId &&
            exist?.email === order?.email
         ) {
            return res.send({
               success: false,
               message: "Order already exist",
            });
         }
         const result = await OrdersCollection.insertOne(order);

         return res.send({ success: true, result });
      });

      //USERS

      //UPDATE OR CREATE USER
      app.put("/users/:email", async (req, res) => {
         const user = req.body;
         const email = req.params.email;
         const filter = { email: email };
         const options = { upsert: true };
         const updateDoc = {
            $set: user,
         };
         const result = await UsersCollection.updateOne(
            filter,
            updateDoc,
            options
         );
         const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
            expiresIn: "1d",
         });
         res.send({ result, accessToken });
      });

      //GET USER BY EMAIL
      app.get("/users/:email", verifyJWT, async (req, res) => {
         const user = await UsersCollection.findOne({
            email: req.params.email,
         });
         res.send(user);
      });
   } catch (error) {
      console.log(error);
   } finally {
   }
};

run().catch(console.dir);

app.get("/", async (req, res) => {
   res.send("hello world");
});
app.listen(port, async (req, res) => {
   console.log(`Server is running in ${port}`);
});
