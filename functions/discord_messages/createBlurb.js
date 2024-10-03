const fs = require('fs')

module.exports = (client) => {
    client.createBlurb = () => {
        let message = fs.readFileSync("national_day_blurb.txt")
        return message.toString()
    }
}