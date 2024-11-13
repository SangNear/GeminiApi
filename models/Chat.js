const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },

    history: [
        {
            role: {
                type: String,
                enum: ["user", "model"],
                required: true
            },
            parts: [
                {
                    text: {
                        type: String,
                        required: true
                    }
                }

            ],
            img: {
                type: String,

            }
        }
    ]
},
    {
        timestamps: true
    }

)

module.exports = mongoose.model('Chat', ChatSchema)