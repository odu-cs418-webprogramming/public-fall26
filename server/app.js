// console.log("Testing app");


import cookieParser from 'cookie-parser';
import cors from "cors";
import express from 'express';
import session from "express-session";
import user from './routes/user.js';

const app = express();
const port = 8080;

app.listen(port, () => {
    console.log(`Server is listening to ${port}`);
})

// console.log("Testing");
// console.log("Testing1");
// console.log("Testing2");
// console.log("Testing3");
// console.log("Testing4");
// console.log("Testing5");

//To allow cross origins
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,// added after cookie-session
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(cookieParser());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "secretkey",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,   // JS cannot read cookie
            secure: true,    // true in production with HTTPS
            sameSite: "lax",
            maxAge: 1000 * 60 * 60, // 1 hour
        },
    })
);



const requestTime = function (req, res, next) {
    req.requestTime = Date.now()
    next()
}

app.use(requestTime)
app.use('/user', user)





// app.get('/', (req, res) => {
//     res.json({
//         "status": 200,
//         "message": "Response by get api"
//     })
// })

// app.post('/user', (req, res) => {
//     res.json({
//         "status": 200,
//         "message": "Response by post api"
//     })
// })


// app.get('/:id', (req, res) => {
//     res.json({
//         "status": 200,
//         "message": `Response by get time api ${req.requestTime}`
//     })
// })

export default app;