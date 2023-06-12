const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.48shya3.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();

    const usersCollection = client.db("notoDb").collection("users");

    // user api related
    app.get('/users',async (req,res) =>{
        const result = await usersCollection.find().toArray()
        res.send(result)
    })
    app.post('/users',async (req,res) =>{
        const user = req.body;
        const query = {email:user.email}
        const exiting = await usersCollection.findOne(query)
        if(exiting){
            return res.send({message: 'user already exist'})
        }
        const result = await usersCollection.insertOne(user)
        res.send(result)
    })

    app.patch('/users/admin/:id',async (req,res) =>{
        const id = req.params.id ;
        const filter = { _id: new ObjectId(id)}
        const updateDoc = {
            $set: {
              role: 'admin'
            },
          };
          const result = await usersCollection.updateOne(filter,updateDoc)
          res.send(result)
    })
    app.patch('/users/instructor/:id',async (req,res) =>{
      const id = req.params.id ;
      const filter = { _id: new ObjectId(id)}
      const updateDoc = {
          $set: {
            role: 'instructor'
          },
        };
        const result = await usersCollection.updateOne(filter,updateDoc)
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



app.get('/',(req,res) =>{
    res.send('Notocard is running')
})

app.listen(port, () =>{
    console.log(`notocard is running on port: ${port}`)
} )