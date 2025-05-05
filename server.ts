import http from 'http';
import express from 'express';
import fileUpload from 'express-fileupload';

const app = express();

const PORT = 3000;
const DB_NAME = "RilieviPerizie";
const CONNECTION_STRING = 'mongodb+srv://sduca2665:PpMEtodbQS3nPA39@rilieviperizie.dndshdr.mongodb.net/';

//MONGO
import { Collection, MongoClient, ObjectId } from 'mongodb';

async function getCollection(collection: string): Promise<Collection> {
  const client = new MongoClient(CONNECTION_STRING);
  await client.connect();
  return client.db(DB_NAME).collection(collection);
}

//la callback di create server viene eseguita ad ogni richiesta giunta dal client
http.createServer(app).listen(PORT, () => {
  console.log('Server listening on port: ' + PORT);
});

//2. Static resource
app.use('/', express.static('./static'));

//Queste due entry ervono per agganciare i parametri nel body
app.use('/', express.json({ limit: '10mb' }));
app.use('/', express.urlencoded({ limit: '10mb', extended: true }));

//4. Upload config
app.use('/', fileUpload({ limits: { fileSize: 10 * 1024 * 1024 } }));

//Middleware
app.use('*', (req: any, res: any, next: any) => {
  console.log(req.method + ': ' + req.originalUrl);
  next();
});

//Client routes

app.post('/autentica', (req: any, res: any, next: any) => {

  getCollection('Utenti').then((collection: Collection) => {

    collection.findOne({ codice_operatore: req.body.username, password: req.body.password }, {
      projection: {
        password: 0
      }
    }).then((data: any) => {
      if (data) {
        res.send({ result: true, data: data });
      } else {
        res.status(401).send({ result: false, data: 'Unauthorized' });
      }
    }).catch((err: any) => {
      console.error(err);
      res.status(500).send({ result: false, data: 'Error retrieving user' });
    });

  }).catch((err) => {
    res.status(500).send({ result: false, data: 'Unauthorized MongoDB: ' + err });
  });

});

app.post('/cambia_password', (req: any, res: any, next: any) => {

  getCollection('Utenti').then((collection: Collection) => {

    collection.updateOne({ codice_operatore: req.body.username, password: req.body.password },{$set:{password: req.body.new_password, primo_accesso: false}}).then((data: any) => {
      if (data.modifiedCount > 0) {
        res.send({ result: true, data: data });
      } else {
        res.status(400).send({ result: false, data: 'Bad Request' });
      }
    }).catch((err: any) => {
      console.error(err);
      res.status(500).send({ result: false, data: 'Error retrieving user' });
    });

  }).catch((err) => {
    res.status(500).send({ result: false, data: 'Unauthorized MongoDB: ' + err });
  });

});

app.get('/utenti', async (req: any, res: any, next: any) => {

  getCollection('Utenti').then((collection: Collection) => {
    collection.find().toArray().then((result: any) => {
      res.send(result);
    }).catch((err: any) => {
      console.error(err);
      res.status(500).send('Error retrieving utenti');
    });
  }).catch((err: any) => {
    console.error(err);
    res.status(500).send('Error connecting to database');
  });
});

app.get('/perizie', async (req: any, res: any, next: any) => {

  getCollection('Perizie').then((collection: Collection) => {
    collection.find().toArray().then((result: any) => {
      res.send(result);
    }).catch((err: any) => {
      console.error(err);
      res.status(500).send('Error retrieving perizie');
    });
  }).catch((err: any) => {
    console.error(err);
    res.status(500).send('Error connecting to database');
  });
});
app.get('/utente', async (req: any, res: any) => {
  const id = new ObjectId(req.query.id);
  getCollection('Utenti').then((collection: Collection) => {
    collection.findOne({ _id: id }, {
      projection: {
        nome: 1,
        cognome: 1,
        email: 1,
        nPerizie: 1,
      }
    }).then((data: any) => {
      if (data) {
        res.send({ result: true, data: data });
      } else {
        res.status(401).send({ result: false, data: 'Unauthorized' });
      }

    }).catch((err: any) => {
      console.error(err);
      res.status(500).send({ result: false, data: 'Error retrieving user' });
    });
  }).catch((err: any) => {
    console.error(err);
    res.status(500).send({ result: false, data: 'Error connecting to Utenti collection' });
  });
});
app.post('/addOperatore', async (req: any, res: any) => {
  getCollection('Utenti').then((collection: Collection) => {
    collection.find().project({codice_operatore: 1}).sort({codice_operatore: -1}).limit(1).toArray().then((data: any) => {
      let codice_operatore = "OP" + (parseInt(data[0].codice_operatore.split('OP')[1]) + 1).toString( );
      
      getCollection('Utenti').then((collection: Collection) => {
      
        data = Object.assign(req.body, {codice_operatore}, {password: "password", amministratore: false, primo_accesso: true, nPerizie: 0});
        
        collection.insertOne(data).then((data: any) => {
          if (data) {
            res.send({ result: true, data: data });
          } else {
            res.status(401).send({ result: false, data: 'Unauthorized' });
          }
        }
        ).catch((err: any) => {
          console.error(err);
          res.status(500).send({ result: false, data: 'Error retrieving user' });
        });
      });
    });
  });
});