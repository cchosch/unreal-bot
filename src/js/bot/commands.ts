const cmds = [
    {
        name: "ping",
        description: "ping the bot"
    },
    {
        name: "get-unreal",
        description: "track an individuals unrealness score",
        options: [
            {
                type: 6,
                name: "user",
                description: "user to be tracked",
                required: true
            }
        ]
    },
    {
        name: "unreal",
        description: "update a user's unreal factor",
        options: [
            {
                type: 6,
                name: "user",
                description: "user to be updated",
                required: true
            },
            {
                type: 4,
                name: "increment",
                description: "ammount to increment by",
                required: true
            },
            {
                type: 3,
                name: "reason",
                description: "reason for change"
            }
        ]
    }
]

module.exports = cmds 