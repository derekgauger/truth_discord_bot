const nationalMonths = require("../../national_months.json")

module.exports = (client) => {
    client.createMonth = async () => {
        const today = new Date()

        const month = today.toLocaleString('default', { month: 'long' })
    
        var months = nationalMonths[month]
        var text = ""
    
        months.forEach(month => {
            text += "\n - " + month
        })
    
        const embed = {
            color: 0xFF0000,
            title: 'National Months',
            url: 'https://nationaltoday.com/what-is-today/',
            author: {
                name: 'Truth - ' + month,
                icon_url: "https://i.imgur.com/6NtiiP4.png",
                url: 'https://nationaltoday.com/what-is-today/',
            },
            thumbnail: {
                url: "https://i.imgur.com/6NtiiP4.png",
            },
            fields: [
                {
                    name: 'Current National Months',
                    value: text,
                },
            ],
            timestamp: today,
            footer: {
                text: 'Truth by Dirk',
                icon_url: "https://i.imgur.com/6NtiiP4.png",
            },
        };    
        
        return embed
    }
}