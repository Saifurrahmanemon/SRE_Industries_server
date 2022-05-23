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

        //ROUTES

        //GET ALL PARTS
        app.get("/parts", async (req, res) => {
            const parts = await PartsCollection.find({}).toArray();
            res.send(parts);
        });

        //GET PART BY ID
        app.get("/parts/:id", async (req, res) => {
            const part = await PartsCollection.findOne({
                _id: ObjectId(req.params.id),
            });
            res.send(part);
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
