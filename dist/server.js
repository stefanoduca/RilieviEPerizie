"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = 3000;
const DB_NAME = "RilieviPerizie";
const CONNECTION_STRING = 'mongodb+srv://sduca2665:PpMEtodbQS3nPA39@rilieviperizie.dndshdr.mongodb.net/';
//MONGO
const mongodb_1 = require("mongodb");
function getCollection(collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new mongodb_1.MongoClient(CONNECTION_STRING);
        yield client.connect();
        return client.db(DB_NAME).collection(collection);
    });
}
//la callback di create server viene eseguita ad ogni richiesta giunta dal client
http_1.default.createServer(app).listen(PORT, () => {
    console.log('Server listening on port: ' + PORT);
});
//2. Static resource
app.use('/', express_1.default.static('./static'));
//Queste due entry ervono per agganciare i parametri nel body
app.use('/', express_1.default.json({ limit: '10mb' }));
app.use('/', express_1.default.urlencoded({ limit: '10mb', extended: true }));
//4. Upload config
app.use('/', (0, express_fileupload_1.default)({ limits: { fileSize: 10 * 1024 * 1024 } }));
//Middleware
app.use('*', (req, res, next) => {
    console.log(req.method + ': ' + req.originalUrl);
    next();
});
const whitelist = ['http://localhost:3000', 'http://localhost:4200', 'https://rilievieperizieduca.onrender.com', 'http://localhost:8100'];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        const trimmedOrigin = origin.trim();
        console.log("Request from origin:", trimmedOrigin);
        if (whitelist.includes(trimmedOrigin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS: " + trimmedOrigin));
        }
    }
};
app.use((0, cors_1.default)(corsOptions));
//Client routes
app.post('/autentica', (req, res, next) => {
    getCollection('Utenti').then((collection) => {
        collection.findOne({ codice_operatore: req.body.username, password: req.body.password }, {
            projection: {
                password: 0,
                token: 0
            }
        }).then((data) => {
            if (data) {
                res.send({ result: true, data: data });
            }
            else {
                res.status(401).send({ result: false, data: 'Unauthorized' });
            }
        }).catch((err) => {
            console.error(err);
            res.status(500).send({ result: false, data: 'Error retrieving user' });
        });
    }).catch((err) => {
        res.status(500).send({ result: false, data: 'Unauthorized MongoDB: ' + err });
    });
});
app.post('/cambia_password', (req, res, next) => {
    getCollection('Utenti').then((collection) => {
        collection.updateOne({ codice_operatore: req.body.username, password: req.body.password }, { $set: { password: req.body.new_password, primo_accesso: false } }).then((data) => {
            if (data.modifiedCount > 0) {
                res.send({ result: true, data: data });
            }
            else {
                res.status(400).send({ result: false, data: 'Bad Request' });
            }
        }).catch((err) => {
            console.error(err);
            res.status(500).send({ result: false, data: 'Error retrieving user' });
        });
    }).catch((err) => {
        res.status(500).send({ result: false, data: 'Unauthorized MongoDB: ' + err });
    });
});
app.get('/utenti', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    getCollection('Utenti').then((collection) => {
        collection.find().toArray().then((result) => {
            res.send(result);
        }).catch((err) => {
            console.error(err);
            res.status(500).send('Error retrieving utenti');
        });
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error connecting to database');
    });
}));
app.get('/perizie', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    getCollection('Perizie').then((collection) => {
        collection.find().toArray().then((result) => {
            res.send(result);
        }).catch((err) => {
            console.error(err);
            res.status(500).send('Error retrieving perizie');
        });
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error connecting to database');
    });
}));
app.get('/utente', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = new mongodb_1.ObjectId(req.query.id);
    getCollection('Utenti').then((collection) => {
        collection.findOne({ _id: id }, {
            projection: {
                nome: 1,
                cognome: 1,
                email: 1,
                nPerizie: 1,
            }
        }).then((data) => {
            if (data) {
                res.send({ result: true, data: data });
            }
            else {
                res.status(401).send({ result: false, data: 'Unauthorized' });
            }
        }).catch((err) => {
            console.error(err);
            res.status(500).send({ result: false, data: 'Error retrieving user' });
        });
    }).catch((err) => {
        console.error(err);
        res.status(500).send({ result: false, data: 'Error connecting to Utenti collection' });
    });
}));
app.post('/addOperatore', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    getCollection('Utenti').then((collection) => {
        collection.find().project({ codice_operatore: 1 }).sort({ codice_operatore: -1 }).limit(1).toArray().then((data) => {
            let codice_operatore = "OP" + (parseInt(data[0].codice_operatore.split('OP')[1]) + 1).toString();
            getCollection('Utenti').then((collection) => {
                // Combina i dati del corpo della richiesta con il codice operatore e imposta i valori predefiniti per password, amministratore, primo accesso e numero di perizie
                data = Object.assign(req.body, { codice_operatore }, { password: "password", amministratore: false, primo_accesso: true, nPerizie: 0 });
                collection.insertOne(data).then((data) => {
                    if (data) {
                        res.send({ result: true, data: data });
                    }
                    else {
                        res.status(401).send({ result: false, data: 'Unauthorized' });
                    }
                }).catch((err) => {
                    console.error(err);
                    res.status(500).send({ result: false, data: 'Error retrieving user' });
                });
            });
        });
    });
}));
// API
app.post('/api/autentica', (req, res) => {
    getCollection('Utenti').then((collection) => {
        collection.findOne({ codice_operatore: req.body.username, password: req.body.password }, {
            projection: {
                password: 0,
            }
        }).then((data) => {
            if (data) {
                res.send({ result: true, data: data });
            }
            else {
                res.status(401).send({ result: false, data: 'Unauthorized' });
            }
        }).catch((err) => {
            console.error(err);
            res.status(500).send({ result: false, data: 'Error retrieving user' });
        });
    }).catch((err) => {
        res.status(500).send({ result: false, data: 'Unauthorized MongoDB: ' + err });
    });
});
app.patch('/api/cambia-password', (req, res) => {
    const token = req.headers['authorization'].split(' ')[1];
    getCollection('Utenti').then((collection) => {
        collection.updateOne({ token: token, password: req.body.password }, { $set: { password: req.body.new_password, primo_accesso: false } }).then((data) => {
            if (data.modifiedCount > 0) {
                res.send({ result: true, data: data });
            }
            else {
                res.status(400).send({ result: false, data: 'Bad Request' });
            }
        }).catch((err) => {
            console.error(err);
            res.status(500).send({ result: false, data: 'Error retrieving user' });
        });
    }).catch((err) => {
        res.status(500).send({ result: false, data: 'Unauthorized MongoDB: ' + err });
    });
});
app.post('/api/upload-perizia', (req, res) => {
    if (!req.headers['authorization'].length) {
        res.status(401).send({ result: false, data: 'Unauthorized' });
        return;
    }
    const token = req.headers['authorization'].split(' ')[1];
    getCollection('Utenti').then((collection) => {
        collection.findOne({ token: token }, {
            projection: {
                password: 0,
            }
        }).then((utente) => {
            getCollection('Perizie').then((collection) => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const datePart = `${year}${month}${day}`;
                collection.find({ codice_perizia: { $regex: `^PZ${datePart}-` } })
                    .project({ codice_perizia: 1 })
                    .sort({ codice_perizia: -1 })
                    .limit(1)
                    .toArray()
                    .then((results) => {
                    let lastNumber = 0;
                    if (results.length > 0) {
                        lastNumber = parseInt(results[0].codice_perizia.split('-')[1], 10);
                    }
                    const codice_perizia = `PZ${datePart}-${String(lastNumber + 1).padStart(3, '0')}`;
                    // Combina il corpo della richiesta con il codice operatore e il codice perizia generato
                    const data = Object.assign(req.body, { codice_operatore: utente.codice_operatore, codice_perizia });
                    collection.insertOne(data).then((insertResult) => {
                        if (insertResult) {
                            res.send({ result: true, data: insertResult });
                        }
                        else {
                            res.status(401).send({ result: false, data: 'Unauthorized' });
                        }
                    }).catch((err) => {
                        console.error(err);
                        res.status(500).send({ result: false, data: 'Error inserting perizia' });
                    });
                }).catch((err) => {
                    console.error(err);
                    res.status(500).send({ result: false, data: 'Error generating codice_perizia' });
                });
            });
        }).catch((err) => {
            console.error(err);
            res.status(500).send({ result: false, data: 'Error retrieving user' });
        });
    });
});
