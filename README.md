'Truth' is a Discord bot that displays the national day and months celebrations.

**Why did I make this?**

Have you ever been minding your own business throughout the day and learned it's National Donut Day. Then you wonder, how are people knowing this type of thing or how can I keep up with the national days? Well here is the answer...

**Add to Server**
- Click the following link: https://discord.com/oauth2/authorize?scope=bot%20applications.commands&client_id=929121472138604614&permissions=277025901632
- Follow instructions in that link

**Server Setup**
- Use the /info command to show the invite and voting links
- Use the /setchannel command to give Truth a target automated messaging channel for your server (Automated messages will **NOT** work if this command is not executed)
- Use the /unsetchannel command to remove automated messages from your server
- Use the /displayday command to show the current national day celebrations
- Use the /displayblurb command to show a short paragraph about the current day

**How Automation Works**
- The national days I am using are pulled from "https://www.nationaltoday.com"
- National Days are be displayed every day at 6:01 AM CST

**How the Truth is running**

Truth is running on an AWS EC2 instance using PM2. I ran into the issue of having to shut my computer off occasionally, so running it local would not work long-term. Putting Truth on a cloud server allows me to not have to worry about when the bot is running.


**If there are issues please message me on Discord at Dirk#8540 or gaugerderek@gmail.com**
