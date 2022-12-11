const nationalDays = require("../../national_days.json")

module.exports = (client) => {
    client.createDay = async () => {
        const today = new Date()

        let date = getDateString(today)
    
        const month = today.toLocaleString('default', { month: 'long' })
        const day = today.getDate()

        var days = nationalDays[month][day]
        var text = ""
        
        days.forEach(day => {
            text += "\n - " + day
        })
    
        const embed = {
            color: 0xFF0000,
            title: 'National Days',
            url: 'https://nationaltoday.com/what-is-today/',
            author: {
                name: 'Truth - ' + date,
                icon_url: "https://i.imgur.com/1wyNxV5.jpg",
                url: 'https://nationaltoday.com/what-is-today/',
            },
            thumbnail: {
                url: "https://i.imgur.com/1wyNxV5.jpg",
            },
            fields: [
                {
                    name: 'Current National Days',
                    value: text,
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