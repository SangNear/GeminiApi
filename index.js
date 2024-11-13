const express = require("express");
const ImageKit = require('imagekit');
const cors = require('cors');
const { default: mongoose } = require("mongoose");
const Chat = require("./models/Chat.js")
const User = require("./models/User.js")
const port = process.env.PORT || 5000
const app = express()
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node")

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use(express.json())

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB)
        console.log("DB Connection Successfully!");

    } catch (error) {
        console.log(error);

    }
}

const imagekit = new ImageKit({
    urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
    publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
    privateKey: process.env.IMAGE_KIT_PRIVATE_KEY
});

app.get("/api/upload", (req, res) => {
    const result = imagekit.getAuthenticationParameters();
    res.send(result);
})

app.get("/api/userchats", ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const userId = req.auth.userId
        
        const userChats = await User.find({ userId: userId })
        if (!userChats[0]) {
            res.status(200).send("ko ton tai user")
        }
        res.status(200).send(userChats[0].chats)
    } catch (error) {
        console.log(error);
        res.status(500).send("Error Fetching chats")
    }
})

app.get("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const userId = req.auth.userId

        const chat = await Chat.findOne({ _id: req.params.id, userId })
        res.status(200).send(chat)
    } catch (error) {
        console.log(error);
        res.status(500).send("Error Fetching chats")
    }
})

app.post("/api/chats",
    ClerkExpressRequireAuth(), async (req, res) => {
        const userId = req.auth.userId
        const { text } = req.body
        //CREATE A NEW CHAT
        try {
            const newChat = new Chat({
                userId: userId,
                history: [
                    {
                        role: "user",
                        parts: [{ text }]
                    }
                ]
            })
            const saveChat = await newChat.save()

            //CHECK WHETHER USER IS EXISTS

            const user = await User.find({ userId: userId })

            //IF USER NOT EXISTS THEN CREATE A NEW ONE AND NEW CHAT ARRAY

            if (!user.length) {
                const newUserChats = User({
                    userId: userId,
                    chats: [
                        {
                            _id: saveChat._id,
                            title: text.substring(0, 40)
                        }
                    ]
                })
                await newUserChats.save();
            }
            //ELSE PUSH A TEXT CHAT TO CHAT ARRAY USER
            else {
                await User.updateOne(
                    { userId: userId },
                    {
                        $push: {
                            chats: {
                                _id: saveChat._id,
                                title: text.substring(0, 40)
                            }
                        }
                    }
                )
                res.status(201).send(newChat._id)
            }
        } catch (error) {
            console.log(error);

        }

    })

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(401).send('Unauthenticated!')
})

app.listen(port, () => {
    connectDb()
    console.log("Server running on http://localhost:5000");
})

