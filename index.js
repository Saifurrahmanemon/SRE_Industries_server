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
        const OrdersCollection = client
            .db("SRE-Industries")
            .collection("orders");

        //ROUTES

        //FOR JWT AUTH
        app.post("/login", async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: "1d",
            });
            res.send({ accessToken });
        });

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

        // ORDERS
        //POST ORDER BY EMAIL
        app.post("/orders", verifyJWT, async (req, res) => {
            const order = req.body;
            const query = {
                productId: order.productId,
            };
            const exist = await OrdersCollection.findOne(query);

            if (exist?.productId === order?.productId) {
                return res.send({
                    success: false,
                    order: exist,
                    message: "order already exist",
                });
            }
            const result = await OrdersCollection.insertOne(order);

            return res.send({ success: true, result });
        });

        //POST PART
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
