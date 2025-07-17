---
title: "How I built Taskerbot"
date: "2025-06-27"
tags: "discord"
---

Developing my latest project, a Discord bot called [Taskerbot](https://github.com/rsomonte/taskerbot), has been an interesting journey full of unexpected turns. The inspiration came from a bot I saw during an event on a Discord server that gamified tasks, and I decided to build my own version. This project quickly evolved into a valuable lesson in modern bot development, especially after a five-year hiatus from the Discord API.
<!-- excerpt -->

---

### The Initial Spark

The concept for Taskerbot came to me a few months ago, inspired by a server event where users submitted tasks for points. Having built bots before, I thought it would be a walk in the park, but I quickly realized my expectations were a bit unrealistic given how much the landscape had changed.

---

### From Memory to Persistence: A Hosting Hurdle

One of the first hurdles I encountered after the initial release was finding a place to host it. I started with Railway, but I'll likely be migrating to a different host soon. Their free plan doesn't support volumes, which became essential for the bot's functionality.

In the first version of Taskerbot, all tasks and objectives were stored in memory. This meant that every time I pushed an update, all that data was wiped. To solve this, I integrated SQLite for persistent storage, which required a volume to hold the database file.

---

### Adapting and Evolving Features

Persistent storage hasn't been the only major change since the first release. I've also implemented a streak system to encourage consistent participation and a delete command for easier task management. To help users stay on track, I recently added a feature where the bot sends a direct message if it notices an objective has been available for over 24 hours without a submission. Another key feature is a 22-hour submission cooldown. This gives users a flexible two-hour window to submit their tasks each day without breaking their streak, accommodating for slightly off-schedule days.

Of course, not every initial idea made it into the final product. I had to adapt. For instance, I originally wanted users to select their objective from a dropdown menu. Unfortunately, the current Discord API doesn't support that in the way I envisioned. My workaround was to have the user type the objective's name, and the bot then verifies if the objective exists in the database and is available for submission. It’s a practical solution that works well.

---

### What's Next?

Since I use Taskerbot daily, I'm constantly finding new things to improve and features to add. I have a few ideas that I plan to implement in the coming weeks, though I am also balancing this with another projects that I'll be sharing here soon.

I'd love for you to check it out and let me know what you think! Any feedback or suggestions for improvement would be greatly appreciated.

You can add Taskerbot to your server using [this link.](https://discord.com/oauth2/authorize?client_id=1378919723189932124)
