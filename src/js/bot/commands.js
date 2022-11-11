const commands = [
    {
        name: "ping",
        description: "ping the bot"
    },
    {
        name: "track",
        description: "track an individuals unrealness score",
        options: [
            {
                type: 6,
                name: "user",
                description: "user to be tracked",
                required: true
            }
        ]
    }
]



module.exports = commands