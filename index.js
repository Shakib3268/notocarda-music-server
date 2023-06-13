const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());


const verifyJWT = (req,res,next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token,process.env.ACCES_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}



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
    const allClassCollection = client.db("notoDb").collection('allclass');
    const selectClassCollection = client.db("notoDb").collection('selectclass');

     // student selected class this api provide this email add data
     app.get('/selectclass', verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email };
      const result = await selectClassCollection.find(query).toArray();
      res.send(result);
    });

    // student selected classes this api post  data
    app.post('/selectclass', async (req, res) => {
      const selectclass = req.body;
      const result = await selectClassCollection.insertOne(selectclass);
      res.send(result);
    })

    // student selected classes delet api 
    app.delete('/selectclass/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await selectClassCollection.deleteOne(query);
      res.send(result);
    })

     //server get the call insturctor email base data provide to user enroll classes
     app.get("/enroledclases/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const enrolclass = await paymentCollection.find({ instructoremail: req.params.email, }).toArray();
      res.send(enrolclass);
    });
    //server get the call user email base data provide to user enroll classes
    app.get("/enrolestudent/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const enrolclass = await paymentCollection.find({ email: req.params.email, }).toArray();
      res.send(enrolclass);
    });

    app.get('/instructors', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })

    // instructor fetch thi api and update class
    app.put("/allclass/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          classname: body.classname,
          image: body.image,
          seats: body.seats,
          price: body.price,
        },
      };
      const result = await allClassCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //all data this api provide to sorting popular classes
    app.get('/popularclasses', async (req, res) => {
      const popularclass = await allClassCollection.find().sort({ enroll: -1 }).limit(6).toArray();
      res.send(popularclass);
    })

    app.put("/allclass/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          classname: body.classname,
          image: body.image,
          seats: body.seats,
          price: body.price,
        },
      };
      const result = await allClassCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get('/singleclass/:id', async (req, res) => {
      const id = req.params.id;
      const query = ({ _id: new ObjectId(id) })
      const result = await allClassCollection.findOne(query);
      res.send(result);
    })

    app.get("/myclass/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const myclass = await allClassCollection.find({ instructoremail: req.params.email, }).toArray();
      res.send(myclass);
    });

    app.delete('/allclass/:id',async (req,res) =>{
      const id = req.params.id 
      const query = {_id : new ObjectId(id)}
      const result = await allClassCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/allclass/aproved/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'aproved'
        },
      };
      const result = await allClassCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get('/allclasses', async (req, res) => {
      const result = await allClassCollection.find().toArray();
      res.send(result);
    })

    app.post('/allclass', async (req, res) => {
      const allclass = req.body;
      const result = await allClassCollection.insertOne(allclass);
      res.send(result);
    })

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }
    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'instructor') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }
    app.post('/jwt', (req,res) =>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCES_TOKEN, { expiresIn: '1h' })
      res.send({ token })
    })

    // user api related
    app.get('/users',verifyJWT,verifyAdmin,async (req,res) =>{
        const result = await usersCollection.find().toArray()
        res.send(result)
    })
    app.get('/users',verifyJWT,verifyInstructor,async (req,res) =>{
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

    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
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
    app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ instructor: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === 'instructor' }
      res.send(result);
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