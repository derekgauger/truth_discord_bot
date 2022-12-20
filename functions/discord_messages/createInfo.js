module.exports = (client) => {

    client.createInfo = async () => {
        const today = new Date()

        let date = getDateString(today)

        const embed = {
            color: 0xFF0000,
            author: {
                name: 'Truth',
                icon_url: "https://i.imgur.com/1wyNxV5.jpg",
                url: 'https://top.gg/bot/929121472138604614',
            },
            thumbnail: {
                url: "https://i.imgur.com/1wyNxV5.jpg",
            },
            fields: [
                {
                    name: 'Link to Truth bot information:',
                    value: 'https://top.gg/bot/929121472138604614',
                },
            ],
            timestamp: today,
            footer: {
                text: 'Truth by Dirk',
                icon_url: "https://i.imgur.com/1wyNxV5.jpg",
            },
        };    

        return embed
    }
}

function getDateString(today) {

    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()

    const date = mm + '/' + dd + '/' + yyyy

    return date;
}
