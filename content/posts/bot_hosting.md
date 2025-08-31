---
title: "An Update on TaskerBot's Hosting"
date: "2025-09-03"
tags: ["discord", "docker", "hosting"]
---

Finding a good host for TaskerBot turned out to be harder than I thought. After a few failed tries with other services, I've landed on a temporary solution: running it on my own machine with Docker.
<!-- excerpt -->

---

In my last post, I mentioned I'd be moving TaskerBot off its initial hosting service. I figured it would be a simple switch, but I was wrong.

I tried a few different hosting options, but they all had problems. Some didn't support what I needed, others just didn't work right. I got frustrated and had to leave the project alone for a bit until I had a better idea.

That idea came while I was learning Docker and Docker Compose. I realized I could just self-host it on my laptop for now. So I did. I put the Docker and Docker Compose files up on [my GitHub](https://github.com/rsomonte/taskerbot) if anyone wants to see them. It's working well, but it's not a permanent fix.

This isn't the final plan, though. A few months back I had the idea to build my own server with an Optiplex I bought. I wanted to self-host my own stuff and depend less on big companies. I haven't started yet because I had to move, and now I'm just waiting for the server (and all my other things) to arrive.

Once it gets here, I'll be able to host TaskerBot properly, 24/7, without worrying about my laptop sleeping. When I finally get it all set up, I'll write another post about the server and how I've got everything structured.

Thanks for reading.